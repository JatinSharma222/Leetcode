import { createClient } from "redis";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { prisma } from "@repo/db";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const client = createClient({ url: redisUrl });

client.on("error", (err) => {
  console.error("Worker Redis Client Error:", err);
});

const TLE_MS = 5000;

// Docker sandbox settings
const DOCKER_MEMORY = "128m";
const DOCKER_CPUS = "0.5";
const DOCKER_PIDS_LIMIT = "64";
const DOCKER_TMPFS_SIZE = "64m";

const DOCKER_IMAGE_BY_LANGUAGE: Record<string, string> = {
  cpp: "sandbox-cpp",
  javascript: "sandbox-javascript",
  python: "sandbox-python",
};

const EXTENSION_BY_LANGUAGE: Record<string, string> = {
  cpp: "cpp",
  javascript: "js",
  python: "py",
};

interface RunResult {
  exitCode: number | null;
  output: string;
  error: string;
  timedOut: boolean;
}

function runProcess(
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

/**
 * Run user code inside a Docker container with strict sandboxing.
 *
 * Security controls applied:
 *   --network=none     → no network access (prevents reverse shells, data exfil)
 *   --memory           → caps RAM usage (prevents memory bombs)
 *   --cpus             → caps CPU usage
 *   --pids-limit       → caps process count (prevents fork bombs)
 *   --read-only        → read-only root filesystem
 *   --tmpfs /tmp       → writable /tmp with size cap (needed for compilation)
 *   --no-new-privileges→ prevents privilege escalation
 *   --rm               → auto-remove container after exit
 */
async function runInDocker(
  language: string,
  code: string,
  input: string,
  timeoutMs: number,
): Promise<RunResult> {
  const image = DOCKER_IMAGE_BY_LANGUAGE[language];
  const extension = EXTENSION_BY_LANGUAGE[language];
  if (!image || !extension) {
    return {
      exitCode: -1,
      output: "",
      error: `Unsupported language: ${language}`,
      timedOut: false,
    };
  }

  // Write code to a unique temp file on the host
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sandbox-"));
  const sourceFile = `solution.${extension}`;
  const hostSourcePath = path.join(tmpDir, sourceFile);
  fs.writeFileSync(hostSourcePath, code);

  try {
    // Build the command that runs inside the container
    let containerCmd: string;
    if (language === "cpp") {
      // Compile and run in one step inside the container
      containerCmd = `cp /code/${sourceFile} /tmp/${sourceFile} && g++ -std=c++17 -o /tmp/solution /tmp/${sourceFile} && /tmp/solution`;
    } else if (language === "javascript") {
      containerCmd = `node /code/${sourceFile}`;
    } else if (language === "python") {
      containerCmd = `python3 /code/${sourceFile}`;
    } else {
      return {
        exitCode: -1,
        output: "",
        error: `Unsupported language: ${language}`,
        timedOut: false,
      };
    }

    const dockerArgs = [
      "run",
      "--rm",
      // --- Security Controls ---
      "--network=none",
      "--memory", DOCKER_MEMORY,
      "--cpus", DOCKER_CPUS,
      "--pids-limit", DOCKER_PIDS_LIMIT,
      "--read-only",
      "--tmpfs", `/tmp:size=${DOCKER_TMPFS_SIZE},exec`,
      "--security-opt=no-new-privileges",
      // Mount the code file read-only
      "-v", `${hostSourcePath}:/code/${sourceFile}:ro`,
      // Use the sandbox image
      image,
      // Execute the command
      "sh", "-c", containerCmd,
    ];

    const result = await runProcess("docker", dockerArgs, input, timeoutMs);

    // If docker timed out, make sure the container is cleaned up.
    // The --rm flag handles normal exits, but SIGKILL on the docker
    // client process may leave the container running.
    if (result.timedOut) {
      // The container name is auto-generated by Docker and we don't track it,
      // but --rm ensures it's cleaned up when the container process ends.
      // The SIGKILL to the `docker run` process propagates to the container.
    }

    return result;
  } finally {
    // Clean up temp files on the host
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_cleanupErr) {
      // Best-effort cleanup
    }
  }
}

function normalize(s: string): string {
  return s
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

client.connect().catch((err) => {
  console.error("Worker failed to connect to Redis initially:", err);
});

async function main() {
  // Verify Docker is available before starting
  const dockerCheck = await runProcess("docker", ["info"], "", 5000);
  if (dockerCheck.exitCode !== 0) {
    console.error("Docker is not available. The worker requires Docker for sandboxed code execution.");
    console.error("Please install Docker and ensure it is running, then restart the worker.");
    process.exit(1);
  }

  // Verify sandbox images exist
  for (const [lang, image] of Object.entries(DOCKER_IMAGE_BY_LANGUAGE)) {
    const imageCheck = await runProcess("docker", ["image", "inspect", image], "", 5000);
    if (imageCheck.exitCode !== 0) {
      console.error(`Sandbox image '${image}' not found for language '${lang}'.`);
      console.error("Run: cd apps/worker/docker && bash build-images.sh");
      process.exit(1);
    }
  }

  console.log("Worker started with Docker sandboxing enabled ✓");

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

      if (!extension) {
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
        const { output, error, exitCode, timedOut } = await runInDocker(
          language,
          code,
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