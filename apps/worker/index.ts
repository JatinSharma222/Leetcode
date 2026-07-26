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

function runWithTimeout(
  cmd: string,
  args: string[],
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

    proc.on("exit", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, output, timedOut });
    });
  });
}

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
    console.log("processing question for user " + parsedResponse.userId);

    if (language === "cpp") {
      console.log("Running users c++ code");
      const filePath = __dirname + "/code/a.cpp";
      fs.writeFileSync(filePath, code);

      const responseCompiler = spawn("clang++", [
        "-std=c++17",
        filePath,
        "-o",
        "./code/main",
      ]);

      let exitCodeCompiler: number | null = null;
      await new Promise<void>((resolve) => {
        responseCompiler.on("exit", async (exitCode) => {
          exitCodeCompiler = exitCode;
          if (exitCode !== 0) {
            await prisma.submission.update({
              where: { id: submissionId },
              data: { status: "Failure" },
            });
          }
          resolve();
        });
      });

      if (exitCodeCompiler !== 0) {
        continue;
      }

      const { exitCode, output, timedOut } = await runWithTimeout(
        "./code/main",
        [],
        TLE_MS,
      );

      console.log(exitCode, "timedOut:", timedOut);

      if (timedOut) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "TLE" },
        });
      } else if (exitCode === 0) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "Success", output },
        });
      } else {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "Failure" },
        });
      }
    }

    if (language === "javascript") {
      console.log("Running users javascript code");
      const filePath = __dirname + "/code/a.js";
      fs.writeFileSync(filePath, code);

      const { exitCode, output, timedOut } = await runWithTimeout(
        "node",
        [filePath],
        TLE_MS,
      );

      console.log(exitCode, "timedOut:", timedOut);

      if (timedOut) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "TLE" },
        });
      } else if (exitCode === 0) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "Success", output },
        });
      } else {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "Failure" },
        });
      }
    }

    if (language === "python") {
      console.log("Running users python code");
      const filePath = __dirname + "/code/a.py";
      fs.writeFileSync(filePath, code);

      const { exitCode, output, timedOut } = await runWithTimeout(
        "python3",
        [filePath],
        TLE_MS,
      );

      console.log(exitCode, "timedOut:", timedOut);

      if (timedOut) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "TLE" },
        });
      } else if (exitCode === 0) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "Success", output },
        });
      } else {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "Failure" },
        });
      }
    }
  }
});
