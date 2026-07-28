import { createClient } from "redis";
import fs from "fs";
import { spawn } from "child_process";
import { prisma } from "@repo/db";

const client = createClient();

const TLE_MS = 5000;

interface RunResult {
  exitCode: number | null;
  output: string;
  timedOut: boolean;
}

function runWithInput(
  cmd: string,
  args: string[],
  input: string,
  timeoutMs: number,
): Promise<RunResult> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args);
    let output = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeoutMs);

    proc.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    proc.stdin.write(input);
    proc.stdin.end();

    proc.on("exit", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, output, timedOut });
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


interface LanguageRunner {
  compile?: (sourcePath: string) => Promise<boolean>;
  run: () => { cmd: string; args: string[] };
}

function getRunner(language: string, sourcePath: string): LanguageRunner | null {
  if (language === "cpp") {
    return {
      compile: async () => {
        const proc = spawn("clang++", [
          "-std=c++17",
          sourcePath,
          "-o",
          "./code/main",
        ]);
        const exitCode: number | null = await new Promise((resolve) => {
          proc.on("exit", resolve);
        });
        return exitCode === 0;
      },
      run: () => ({ cmd: "./code/main", args: [] }),
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

client.connect().then(async () => {
  while (1) {
    const response = await client.rPop("problems");
    if (!response) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    const parsedResponse = JSON.parse(response);
    const code = parsedResponse.code;
    const language = parsedResponse.language;
    const submissionId = parsedResponse.submissionId;
    const questionId = parsedResponse.questionId;
    console.log("processing question for user " + parsedResponse.userId);

    const extension = EXTENSION_BY_LANGUAGE[language];
    const runner = extension ? getRunner(language, `${__dirname}/code/a.${extension}`) : null;

    if (!runner || !extension) {
      console.log("Unsupported language:", language);
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "Failure" },
      });
      continue;
    }

    const sourcePath = `${__dirname}/code/a.${extension}`;
    fs.writeFileSync(sourcePath, code);

    if (runner.compile) {
      const compiled = await runner.compile(sourcePath);
      if (!compiled) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "Failure" },
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
        data: { status: "Failure" },
      });
      continue;
    }

    let passedCount = 0;
    let anyTimedOut = false;
    let lastOutput = "";
    const resultRows: {
      testCaseId: string;
      passed: boolean;
      actualOutput: string;
      timedOut: boolean;
    }[] = [];

    for (const testCase of testCases) {
      const { cmd, args } = runner.run();
      const { output, timedOut } = await runWithInput(
        cmd,
        args,
        testCase.input,
        TLE_MS,
      );

      const passed = !timedOut && normalize(output) === normalize(testCase.expectedOutput);
      if (passed) passedCount++;
      if (timedOut) anyTimedOut = true;
      lastOutput = output;

      resultRows.push({
        testCaseId: testCase.id,
        passed,
        actualOutput: output,
        timedOut,
      });
    }

    const status = anyTimedOut
      ? "TLE"
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
  }
});