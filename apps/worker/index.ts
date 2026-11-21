import { createClient } from "redis";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { prisma } from "@repo/db";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
// Dedicated client for blocking queue BRPOP operations
const queueClient = createClient({ url: redisUrl });
queueClient.on("error", (err) => {
  console.error("Worker Queue Redis Client Error:", err);
});

// Dedicated client for pushing ephemeral results, updates, and non-blocking commands
const resultClient = createClient({ url: redisUrl });
resultClient.on("error", (err) => {
  console.error("Worker Result Redis Client Error:", err);
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

const MAX_OUTPUT_BUFFER_BYTES = 256 * 1024; // 256 KB cap per process execution

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
        if (output.length < MAX_OUTPUT_BUFFER_BYTES) {
          output += chunk.toString();
          if (output.length >= MAX_OUTPUT_BUFFER_BYTES) {
            output += "\n[Output truncated: exceeded 256KB buffer limit]";
          }
        }
      });
      proc.stdout.on("error", () => {});
    }

    if (proc.stderr) {
      proc.stderr.on("data", (chunk) => {
        if (error.length < MAX_OUTPUT_BUFFER_BYTES) {
          error += chunk.toString();
          if (error.length >= MAX_OUTPUT_BUFFER_BYTES) {
            error += "\n[Stderr truncated: exceeded 256KB buffer limit]";
          }
        }
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

interface ExecutionSession {
  language: string;
  tmpDir: string;
  sourceFile: string;
  compiledBinaryPath?: string;
  compileError?: string;
}

/**
 * Phase 1: Prepare execution environment.
 * For compiled languages (C++), compiles the binary ONCE.
 * For interpreted languages, performs quick syntax validation.
 */
async function prepareExecution(language: string, code: string): Promise<ExecutionSession> {
  const extension = EXTENSION_BY_LANGUAGE[language];
  const image = DOCKER_IMAGE_BY_LANGUAGE[language];
  if (!extension || !image) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sandbox-"));
  // Give sandbox user inside container full read/write/exec access to temporary sandbox
  try {
    fs.chmodSync(tmpDir, 0o777);
  } catch {}

  const sourceFile = `solution.${extension}`;
  const hostSourcePath = path.join(tmpDir, sourceFile);
  fs.writeFileSync(hostSourcePath, code);

  const session: ExecutionSession = {
    language,
    tmpDir,
    sourceFile,
  };

  if (language === "cpp") {
    // Compile C++ source once into binary
    const compileArgs = [
      "run",
      "--rm",
      "--network=none",
      "--memory=256m",
      "--cpus=1.0",
      "-v", `${tmpDir}:/sandbox`,
      image,
      "sh", "-c", "g++ -std=c++17 -O2 -o /sandbox/solution /sandbox/solution.cpp",
    ];

    const compileResult = await runProcess("docker", compileArgs, "", 10000);
    if (compileResult.exitCode !== 0 || compileResult.timedOut) {
      session.compileError =
        compileResult.error.trim() ||
        compileResult.output.trim() ||
        (compileResult.timedOut ? "Compilation timed out (exceeded 10s)" : "Compilation failed");
    } else {
      session.compiledBinaryPath = path.join(tmpDir, "solution");
      try {
        fs.chmodSync(session.compiledBinaryPath, 0o755);
      } catch {}
    }
  } else if (language === "python") {
    // Fast syntax validation
    const checkArgs = [
      "run",
      "--rm",
      "--network=none",
      "-v", `${hostSourcePath}:/code/solution.py:ro`,
      image,
      "python3", "-m", "py_compile", "/code/solution.py",
    ];
    const checkResult = await runProcess("docker", checkArgs, "", 5000);
    if (checkResult.exitCode !== 0) {
      session.compileError = checkResult.error.trim() || checkResult.output.trim() || "Python syntax error";
    }
  } else if (language === "javascript") {
    // Fast syntax validation
    const checkArgs = [
      "run",
      "--rm",
      "--network=none",
      "-v", `${hostSourcePath}:/code/solution.js:ro`,
      image,
      "node", "--check", "/code/solution.js",
    ];
    const checkResult = await runProcess("docker", checkArgs, "", 5000);
    if (checkResult.exitCode !== 0) {
      session.compileError = checkResult.error.trim() || checkResult.output.trim() || "JavaScript syntax error";
    }
  }

  return session;
}

/**
 * Phase 2: Execute code against input in isolated Docker sandbox.
 */
async function runTestInSession(
  session: ExecutionSession,
  input: string,
  timeoutMs: number,
): Promise<RunResult> {
  if (session.compileError) {
    return {
      exitCode: 1,
      output: "",
      error: session.compileError,
      timedOut: false,
      durationMs: 0,
    };
  }

  const image = DOCKER_IMAGE_BY_LANGUAGE[session.language];
  if (!image) {
    return {
      exitCode: -1,
      output: "",
      error: `Unsupported language: ${session.language}`,
      timedOut: false,
      durationMs: 0,
    };
  }
  const containerName = `leetcode-exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let dockerArgs: string[];
  if (session.language === "cpp" && session.compiledBinaryPath) {
    dockerArgs = [
      "run",
      "-i",
      "--rm",
      "--name", containerName,
      "--network=none",
      "--memory", DOCKER_MEMORY,
      "--cpus", DOCKER_CPUS,
      "--pids-limit", DOCKER_PIDS_LIMIT,
      "--read-only",
      "--security-opt=no-new-privileges",
      "-v", `${session.compiledBinaryPath}:/bin/solution:ro`,
      image,
      "/bin/solution",
    ];
  } else if (session.language === "python" || session.language === "javascript") {
    const hostSourcePath = path.join(session.tmpDir, session.sourceFile);
    const execCmd = session.language === "python" ? ["python3", `/code/${session.sourceFile}`] : ["node", `/code/${session.sourceFile}`];
    dockerArgs = [
      "run",
      "-i",
      "--rm",
      "--name", containerName,
      "--network=none",
      "--memory", DOCKER_MEMORY,
      "--cpus", DOCKER_CPUS,
      "--pids-limit", DOCKER_PIDS_LIMIT,
      "--read-only",
      "--security-opt=no-new-privileges",
      "-v", `${hostSourcePath}:/code/${session.sourceFile}:ro`,
      image,
      ...execCmd,
    ];
  } else {
    return {
      exitCode: -1,
      output: "",
      error: `Unsupported language: ${session.language}`,
      timedOut: false,
      durationMs: 0,
    };
  }

  const result = await runProcess("docker", dockerArgs, input, timeoutMs);

  if (result.timedOut) {
    try {
      await runProcess("docker", ["rm", "-f", containerName], "", 3000);
    } catch {}
  }

  return result;
}

function cleanupSession(session: ExecutionSession) {
  try {
    fs.rmSync(session.tmpDir, { recursive: true, force: true });
  } catch {}
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

queueClient.connect().catch((err) => {
  console.error("Worker failed to connect queue client to Redis initially:", err);
});
resultClient.connect().catch((err) => {
  console.error("Worker failed to connect result client to Redis initially:", err);
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
  const WORKER_CONCURRENCY = Math.max(1, Number(process.env.WORKER_CONCURRENCY) || 4);
  const activeJobs = new Set<Promise<void>>();

  // Graceful shutdown handler
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nWorker shutting down gracefully... Waiting for ${activeJobs.size} active jobs to finish.`);
    try {
      await Promise.all(activeJobs);
      if (queueClient.isOpen) await queueClient.disconnect();
      if (resultClient.isOpen) await resultClient.disconnect();
      await prisma.$disconnect();
    } catch {}
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (!shuttingDown) {
    // Throttle popping if worker is currently running at max capacity
    if (activeJobs.size >= WORKER_CONCURRENCY) {
      await Promise.race(activeJobs);
    }

    let response: { key: string; element: string } | null = null;
    try {
      if (!queueClient.isOpen) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      // BRPOP blocks on both ephemeral run_requests and persistent problems
      response = (await queueClient.brPop(["run_requests", "problems"], 5)) as {
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

    const currentKey = response.key;
    const jobPromise = (async () => {
      try {
        if (currentKey === "run_requests") {
          await handleRunRequest(parsedResponse);
        } else if (currentKey === "problems") {
          await handleSubmission(parsedResponse);
        }
      } catch (jobErr) {
        console.error(`[Worker] Unhandled error processing job from ${currentKey}:`, jobErr);
      }
    })();

    activeJobs.add(jobPromise);
    jobPromise.finally(() => {
      activeJobs.delete(jobPromise);
    });
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
      await resultClient.lPush(
        `run_results:${runId}`,
        JSON.stringify({
          runId,
          status: "Failure",
          durationMs: 0,
          executionTimeMs: 0,
          output: "",
          error: `Unsupported language: ${language}`,
          cases: [],
        }),
      );
      await resultClient.expire(`run_results:${runId}`, 60);
      return;
    }

    let casesToRun: { input: string; expectedOutput: string; isSample?: boolean }[] = [];

    if (customTestCases && Array.isArray(customTestCases) && customTestCases.length > 0) {
      // Security: Only compare against public sample test cases to prevent hidden testcase exfiltration
      const sampleCases = await prisma.testCase.findMany({
        where: { questionId, isSample: true },
      });
      casesToRun = customTestCases.map((input) => {
        const match = sampleCases.find((tc) => normalize(tc.input) === normalize(input));
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
      await resultClient.lPush(
        `run_results:${runId}`,
        JSON.stringify({
          runId,
          status: "Failure",
          durationMs: 0,
          executionTimeMs: 0,
          output: "",
          error: "No test cases configured for this question.",
          cases: [],
        }),
      );
      await resultClient.expire(`run_results:${runId}`, 60);
      return;
    }

    // Two-Phase Compilation & Execution
    const session = await prepareExecution(language, code);

    try {
      if (session.compileError) {
        await resultClient.lPush(
          `run_results:${runId}`,
          JSON.stringify({
            runId,
            status: "CompileError",
            durationMs: 0,
            executionTimeMs: 0,
            output: "",
            error: session.compileError,
            cases: [],
          }),
        );
        await resultClient.expire(`run_results:${runId}`, 60);
        return;
      }

      let allPassed = true;
      let anyTimedOut = false;
      let anyOOM = false;
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
        const { output, error, exitCode, timedOut, durationMs } = await runTestInSession(
          session,
          testCase.input,
          TLE_MS,
        );

        if (durationMs > maxDurationMs) {
          maxDurationMs = durationMs;
        }

        const isOOM = exitCode === 137;
        const hasRuntimeError =
          !timedOut &&
          !isOOM &&
          (exitCode !== 0 || (error.trim().length > 0 && output.trim().length === 0));

        if (isOOM) anyOOM = true;
        if (hasRuntimeError) anyRuntimeError = true;
        if (timedOut) anyTimedOut = true;

        const passed =
          !timedOut &&
          !isOOM &&
          !hasRuntimeError &&
          (testCase.expectedOutput ? normalize(output) === normalize(testCase.expectedOutput) : true);

        if (!passed) {
          allPassed = false;
        }

        caseResults.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: output.trim(),
          error: isOOM ? "Memory Limit Exceeded (128MB)" : error.trim(),
          passed,
          timedOut,
          durationMs,
        });
      }

      const overallStatus = anyTimedOut
        ? "TLE"
        : anyOOM
          ? "MLE"
          : anyRuntimeError
            ? "RuntimeError"
            : allPassed
              ? "Accepted"
              : "WrongAnswer";

      const firstError = caseResults.find((c) => c.error)?.error || "";
      const combinedOutput = caseResults
        .map((c, i) => (casesToRun.length > 1 ? `Case ${i + 1}:\n${c.actualOutput || c.error}` : (c.actualOutput || c.error)))
        .filter(Boolean)
        .join("\n\n");

      await resultClient.lPush(
        `run_results:${runId}`,
        JSON.stringify({
          runId,
          status: overallStatus,
          durationMs: maxDurationMs,
          executionTimeMs: maxDurationMs,
          output: combinedOutput || (caseResults[0]?.actualOutput ?? ""),
          error: firstError,
          cases: caseResults,
        }),
      );
      await resultClient.expire(`run_results:${runId}`, 60);
    } finally {
      cleanupSession(session);
    }
  } catch (err: any) {
    console.error(`[Worker] Error running code for runId ${runId}:`, err);
    await resultClient.lPush(
      `run_results:${runId}`,
      JSON.stringify({
        runId,
        status: "Failure",
        durationMs: 0,
        executionTimeMs: 0,
        output: "",
        error: `Execution engine error: ${err?.message || "Internal error"}`,
        cases: [],
      }),
    );
    await resultClient.expire(`run_results:${runId}`, 60);
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

    // Two-Phase Compilation & Execution
    await resultClient.publish(
      `submission_events:${submissionId}`,
      JSON.stringify({ type: "compiling" }),
    );
    const session = await prepareExecution(language, code);

    try {
      if (session.compileError) {
        console.log(`Submission ${submissionId} failed compilation: ${session.compileError}`);
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: "CompileError",
            output: session.compileError,
            passedCount: 0,
            totalCount: testCases.length,
          },
        });
        await resultClient.publish(
          `submission_events:${submissionId}`,
          JSON.stringify({
            type: "completed",
            status: "CompileError",
            error: session.compileError,
          }),
        );
        return;
      }

      let passedCount = 0;
      let anyTimedOut = false;
      let anyOOM = false;
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
        const { output, error, exitCode, timedOut } = await runTestInSession(
          session,
          testCase.input,
          TLE_MS,
        );

        const isOOM = exitCode === 137;
        const hasRuntimeError =
          !timedOut &&
          !isOOM &&
          (exitCode !== 0 || (error.trim().length > 0 && output.trim().length === 0));

        if (isOOM) anyOOM = true;
        if (hasRuntimeError) anyRuntimeError = true;
        if (timedOut) anyTimedOut = true;

        const passed =
          !timedOut &&
          !isOOM &&
          !hasRuntimeError &&
          normalize(output) === normalize(testCase.expectedOutput);

        if (passed) passedCount++;

        const errorNote = isOOM ? "Memory Limit Exceeded (128MB)" : error.trim();
        const displayOutput = errorNote
          ? output.trim()
            ? `${output.trim()}\n[Stderr]: ${errorNote}`
            : errorNote
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

        // Broadcast test case completion over Redis PubSub for real-time SSE streaming
        await resultClient.publish(
          `submission_events:${submissionId}`,
          JSON.stringify({
            type: "testcase",
            current: resultRows.length,
            total: testCases.length,
            passed,
            durationMs: timedOut ? TLE_MS : 0,
          }),
        );
      }

      const status = anyTimedOut
        ? "TLE"
        : anyOOM
          ? "MLE"
          : anyRuntimeError && passedCount === 0
            ? "RuntimeError"
            : passedCount === testCases.length
              ? "Accepted"
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

      // Broadcast final completed state over Redis PubSub
      await resultClient.publish(
        `submission_events:${submissionId}`,
        JSON.stringify({
          type: "completed",
          status,
          passedCount,
          totalCount: testCases.length,
          output: finalOutput,
        }),
      );
    } finally {
      cleanupSession(session);
    }
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