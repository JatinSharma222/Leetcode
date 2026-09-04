import { createClient } from "redis";
import fs from "fs";
import { spawn } from "child_process";
import { prisma } from "@repo/db";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const client = createClient({ url: redisUrl });

client.on("error", (err) => {
  console.error("Worker Redis Client Error:", err);
});

const TLE_MS = 5000;

interface RunResult {
  exitCode: number | null;
  output: string;
  error: string;
  timedOut: boolean;
}

function runWithInput(
  cmd: string,
  args: string[],
  input: string,
  timeoutMs: number,
): Promise<RunResult> {
  return new Promise((resolve) => {
    let output = "";
    let error = "";
    let timedOut = false;
    let proc: ReturnType<typeof spawn>;

    try {
      proc = spawn(cmd, args);
    } catch (err: any) {
      return resolve({
        exitCode: -1,
        output: "",
        error: err?.message || String(err),
        timedOut: false,
      });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeoutMs);

    proc.on("error", (err) => {
      error += (err?.message || String(err));
    });

    if (proc.stdout) {
      proc.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });
      proc.stdout.on("error", () => {});
    }

    if (proc.stderr) {
      proc.stderr.on("data", (chunk) => {
        error += chunk.toString();
      });
      proc.stderr.on("error", () => {});
    }

    if (proc.stdin) {
      proc.stdin.on("error", (_err) => {
        // Suppress EPIPE errors if child process terminates before stdin stream finishes
      });

      try {
        if (input) {
          proc.stdin.write(input);
        }
        proc.stdin.end();
      } catch (_err) {
        // Ignore synchronous write errors
      }
    }

    proc.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, output, error, timedOut });
    });
  });
}

function normalize(s: string): string {
  return s
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

interface CompileResult {
  success: boolean;
  error?: string;
}

interface LanguageRunner {
  compile?: (sourcePath: string) => Promise<CompileResult>;
  run: () => { cmd: string; args: string[] };
}

function getRunner(language: string, sourcePath: string): LanguageRunner | null {
  if (language === "cpp") {
    const mainBinPath = `${__dirname}/code/main`;
    return {
      compile: async (src: string) => {
        return new Promise<CompileResult>((resolve) => {
          let compileError = "";
          let proc: ReturnType<typeof spawn>;
          try {
            proc = spawn("clang++", [
              "-std=c++17",
              src,
              "-o",
              mainBinPath,
            ]);
          } catch (err: any) {
            return resolve({
              success: false,
              error: err?.message || String(err),
            });
          }

          proc.stderr?.on("data", (chunk) => {
            compileError += chunk.toString();
          });

          proc.on("error", (err) => {
            compileError += (err?.message || String(err));
          });

          proc.on("close", (exitCode) => {
            resolve({
              success: exitCode === 0,
              error: compileError.trim(),
            });
          });
        });
      },
      run: () => ({ cmd: mainBinPath, args: [] }),
    };
  }

  if (language === "javascript") {
    return {
      run: () => ({ cmd: "node", args: [sourcePath] }),
    };
  }

  if (language === "python") {
    return {
      run: () => ({ cmd: "python3", args: [sourcePath] }),
    };
  }

  return null;
}

const EXTENSION_BY_LANGUAGE: Record<string, string> = {
  cpp: "cpp",
  javascript: "js",
  python: "py",
};

client.connect().catch((err) => {
  console.error("Worker failed to connect to Redis initially:", err);
});

async function main() {
  while (1) {
    let response: string | null = null;
    try {
      if (!client.isOpen) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      response = await client.rPop("problems");
    } catch (redisErr) {
      console.error("Error popping problem from Redis:", redisErr);
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    if (!response) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseErr) {
      console.error("Failed to parse queue message JSON:", parseErr);
      continue;
    }

    const { code, language, submissionId, questionId, userId } = parsedResponse;
    console.log("processing question for user " + userId);

    try {
      const extension = EXTENSION_BY_LANGUAGE[language];
      const codeDir = `${__dirname}/code`;
      if (!fs.existsSync(codeDir)) {
        fs.mkdirSync(codeDir, { recursive: true });
      }

      const sourcePath = `${codeDir}/a.${extension}`;
      const runner = extension ? getRunner(language, sourcePath) : null;

      if (!runner || !extension) {
        console.log("Unsupported language:", language);
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: "Failure",
            output: `Unsupported language: ${language}`,
          },
        });
        continue;
      }

      fs.writeFileSync(sourcePath, code);

      if (runner.compile) {
        const compiled = await runner.compile(sourcePath);
        if (!compiled.success) {
          console.log("Compilation failed for submission:", submissionId);
          await prisma.submission.update({
            where: { id: submissionId },
            data: {
              status: "Failure",
              output: compiled.error || "Compilation failed",
            },
          });
          continue;
        }
      }

      const testCases = await prisma.testCase.findMany({
        where: { questionId },
        orderBy: { order: "asc" },
      });

      if (testCases.length === 0) {
        console.log("No test cases found for question", questionId);
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: "Failure",
            output: "No test cases configured for this question.",
          },
        });
        continue;
      }

      let passedCount = 0;
      let anyTimedOut = false;
      let anyRuntimeError = false;
      let lastOutput = "";
      const resultRows: {
        testCaseId: string;
        passed: boolean;
        actualOutput: string;
        timedOut: boolean;
      }[] = [];

      for (const testCase of testCases) {
        const { cmd, args } = runner.run();
        const { output, error, exitCode, timedOut } = await runWithInput(
          cmd,
          args,
          testCase.input,
          TLE_MS,
        );

        const hasRuntimeError =
          !timedOut &&
          (exitCode !== 0 || (error.trim().length > 0 && output.trim().length === 0));

        if (hasRuntimeError) {
          anyRuntimeError = true;
        }

        const passed =
          !timedOut &&
          !hasRuntimeError &&
          normalize(output) === normalize(testCase.expectedOutput);

        if (passed) passedCount++;
        if (timedOut) anyTimedOut = true;

        const displayOutput = error.trim()
          ? output.trim()
            ? `${output.trim()}\n[Stderr]: ${error.trim()}`
            : error.trim()
          : output.trim();

        lastOutput = displayOutput;

        resultRows.push({
          testCaseId: testCase.id,
          passed,
          actualOutput: displayOutput,
          timedOut,
        });
      }

      const status = anyTimedOut
        ? "TLE"
        : anyRuntimeError && passedCount === 0
          ? "Failure"
          : passedCount === testCases.length
            ? "Success"
            : "WrongAnswer";

      console.log(`${passedCount}/${testCases.length} passed, status: ${status}`);

      await prisma.$transaction([
        prisma.submission.update({
          where: { id: submissionId },
          data: {
            status,
            output: lastOutput,
            passedCount,
            totalCount: testCases.length,
          },
        }),
        prisma.submissionResult.createMany({
          data: resultRows.map((r) => ({
            submissionId,
            testCaseId: r.testCaseId,
            passed: r.passed,
            actualOutput: r.actualOutput,
            timedOut: r.timedOut,
          })),
        }),
      ]);
    } catch (submissionErr: any) {
      console.error(`Error processing submission ${submissionId}:`, submissionErr);
      try {
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: "Failure",
            output: `Worker runtime error: ${submissionErr?.message || "Internal error"}`,
          },
        });
      } catch (dbErr) {
        console.error("Failed to update submission status after error:", dbErr);
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal worker error:", err);
});