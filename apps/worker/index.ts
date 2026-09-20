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
  cpp: "leetcode-sandbox-cpp",
  javascript: "leetcode-sandbox-javascript",
  python: "leetcode-sandbox-python",
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
  durationMs: number;
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
    const startTime = Date.now();

    try {
      proc = spawn(cmd, args);
    } catch (err: any) {
      return resolve({
        exitCode: -1,
        output: "",
        error: err?.message || String(err),
        timedOut: false,
        durationMs: 0,
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
        if (input !== undefined && input !== null) {
          // Ensure trailing newline so stdin line readers do not hang
          const formattedInput = input.endsWith("\n") ? input : input + "\n";
          proc.stdin.write(formattedInput);
        }
        proc.stdin.end();
      } catch (_err) {
        // Ignore synchronous write errors
      }
    }

    proc.on("close", (exitCode) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      resolve({ exitCode, output, error, timedOut, durationMs });
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
      durationMs: 0,
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
        durationMs: 0,
      };
    }

    const containerName = `leetcode-exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const dockerArgs = [
      "run",
      "-i",
      "--rm",
      "--name", containerName,
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

    // If docker timed out, make sure the container is killed and cleaned up.
    if (result.timedOut) {
      try {
        await runProcess("docker", ["rm", "-f", containerName], "", 3000);
      } catch (_killErr) {}
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
  if (!s) return "";
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
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

  // Verify sandbox images exist (check leetcode-sandbox-* first, fall back to sandbox-*)
  for (const [lang, preferredImage] of Object.entries(DOCKER_IMAGE_BY_LANGUAGE)) {
    let imageCheck = await runProcess("docker", ["image", "inspect", preferredImage], "", 5000);
    if (imageCheck.exitCode !== 0) {
      const fallbackImage = preferredImage.replace("leetcode-", "");
      const fallbackCheck = await runProcess("docker", ["image", "inspect", fallbackImage], "", 5000);
      if (fallbackCheck.exitCode === 0) {
        DOCKER_IMAGE_BY_LANGUAGE[lang] = fallbackImage;
        continue;
      }
      console.error(`Sandbox image '${preferredImage}' (or '${fallbackImage}') not found for language '${lang}'.`);
      console.error("Run: cd apps/worker/docker && bash build-images.sh");
      process.exit(1);
    }
  }

  console.log("Worker started with Docker sandboxing enabled ✓");

  let shuttingDown = false;

  // Graceful shutdown handler
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\nWorker shutting down gracefully...");
    try {
      if (client.isOpen) await client.disconnect();
      await prisma.$disconnect();
    } catch {}
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (!shuttingDown) {
    let response: { key: string; element: string } | null = null;
    try {
      if (!client.isOpen) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      // BRPOP blocks on both ephemeral run_requests and persistent problems
      response = (await client.brPop(["run_requests", "problems"], 5)) as {
        key: string;
        element: string;
      } | null;
    } catch (redisErr) {
      console.error("Error popping problem from Redis:", redisErr);
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    if (!response) {
      continue;
    }

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(response.element);
    } catch (parseErr) {
      console.error("Failed to parse queue message JSON:", parseErr);
      continue;
    }

    if (response.key === "run_requests") {
      await handleRunRequest(parsedResponse);
    } else if (response.key === "problems") {
      await handleSubmission(parsedResponse);
    }
  }
}

async function handleRunRequest(data: {
  runId: string;
  code: string;
  language: string;
  questionId: string;
  userId: string;
  customTestCases?: string[];
}) {
  const { runId, code, language, questionId, userId, customTestCases } = data;
  console.log(`[Worker] Running test check for user ${userId}, runId: ${runId}`);

  try {
    const extension = EXTENSION_BY_LANGUAGE[language];
    if (!extension) {
      await client.lPush(
        `run_results:${runId}`,
        JSON.stringify({
          runId,
          status: "Failure",
          durationMs: 0,
          error: `Unsupported language: ${language}`,
          cases: [],
        }),
      );
      await client.expire(`run_results:${runId}`, 60);
      return;
    }

    let casesToRun: { input: string; expectedOutput: string; isSample?: boolean }[] = [];

    if (customTestCases && Array.isArray(customTestCases) && customTestCases.length > 0) {
      const dbCases = await prisma.testCase.findMany({
        where: { questionId },
      });
      casesToRun = customTestCases.map((input) => {
        const match = dbCases.find((tc) => normalize(tc.input) === normalize(input));
        return {
          input,
          expectedOutput: match ? match.expectedOutput : "",
          isSample: false,
        };
      });
    } else {
      let sampleCases = await prisma.testCase.findMany({
        where: { questionId, isSample: true },
        orderBy: { order: "asc" },
      });
      if (sampleCases.length === 0) {
        sampleCases = await prisma.testCase.findMany({
          where: { questionId },
          orderBy: { order: "asc" },
          take: 3,
        });
      }
      casesToRun = sampleCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isSample: tc.isSample,
      }));
    }

    if (casesToRun.length === 0) {
      await client.lPush(
        `run_results:${runId}`,
        JSON.stringify({
          runId,
          status: "Failure",
          durationMs: 0,
          error: "No test cases configured for this question.",
          cases: [],
        }),
      );
      await client.expire(`run_results:${runId}`, 60);
      return;
    }

    let allPassed = true;
    let anyTimedOut = false;
    let anyRuntimeError = false;
    let maxDurationMs = 0;
    const caseResults: {
      input: string;
      expectedOutput: string;
      actualOutput: string;
      error: string;
      passed: boolean;
      timedOut: boolean;
      durationMs: number;
    }[] = [];

    for (const testCase of casesToRun) {
      const { output, error, exitCode, timedOut, durationMs } = await runInDocker(
        language,
        code,
        testCase.input,
        TLE_MS,
      );

      if (durationMs > maxDurationMs) {
        maxDurationMs = durationMs;
      }

      const hasRuntimeError =
        !timedOut &&
        (exitCode !== 0 || (error.trim().length > 0 && output.trim().length === 0));

      if (hasRuntimeError) {
        anyRuntimeError = true;
      }
      if (timedOut) {
        anyTimedOut = true;
      }

      const passed =
        !timedOut &&
        !hasRuntimeError &&
        (testCase.expectedOutput ? normalize(output) === normalize(testCase.expectedOutput) : true);

      if (!passed) {
        allPassed = false;
      }

      caseResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: output.trim(),
        error: error.trim(),
        passed,
        timedOut,
        durationMs,
      });
    }

    const overallStatus = anyTimedOut
      ? "TLE"
      : anyRuntimeError
        ? "Failure"
        : allPassed
          ? "Accepted"
          : "WrongAnswer";

    await client.lPush(
      `run_results:${runId}`,
      JSON.stringify({
        runId,
        status: overallStatus,
        durationMs: maxDurationMs,
        cases: caseResults,
      }),
    );
    await client.expire(`run_results:${runId}`, 60);
  } catch (err: any) {
    console.error(`[Worker] Error running code for runId ${runId}:`, err);
    await client.lPush(
      `run_results:${runId}`,
      JSON.stringify({
        runId,
        status: "Failure",
        durationMs: 0,
        error: `Execution engine error: ${err?.message || "Internal error"}`,
        cases: [],
      }),
    );
    await client.expire(`run_results:${runId}`, 60);
  }
}

async function handleSubmission(parsedResponse: any) {
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
      return;
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
      return;
    }

    let passedCount = 0;
    let anyTimedOut = false;
    let anyRuntimeError = false;
    let lastOutput = "";
    let firstFailingOutput = "";
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

      if (!passed && !firstFailingOutput) {
        firstFailingOutput = displayOutput;
      }
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

    const finalOutput = passedCount === testCases.length ? lastOutput : (firstFailingOutput || lastOutput);

    await prisma.$transaction([
      prisma.submission.update({
        where: { id: submissionId },
        data: {
          status,
          output: finalOutput,
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

main().catch((err) => {
  console.error("Fatal worker error:", err);
});