/*
  Warnings:

  - The values [RE,CE] on the enum `SubmissionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `executionTime` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `memoryUsed` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `passedTests` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `totalTests` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `isHidden` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `memoryLimitMb` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `timeLimitMs` on the `TestCase` table. All the data in the column will be lost.
  - Changed the type of `language` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubmissionStatus_new" AS ENUM ('Processing', 'Success', 'WrongAnswer', 'Failure', 'TLE');
ALTER TABLE "public"."Submission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Submission" ALTER COLUMN "status" TYPE "SubmissionStatus_new" USING ("status"::text::"SubmissionStatus_new");
ALTER TYPE "SubmissionStatus" RENAME TO "SubmissionStatus_old";
ALTER TYPE "SubmissionStatus_new" RENAME TO "SubmissionStatus";
DROP TYPE "public"."SubmissionStatus_old";
ALTER TABLE "Submission" ALTER COLUMN "status" SET DEFAULT 'Processing';
COMMIT;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "executionTime",
DROP COLUMN "memoryUsed",
DROP COLUMN "passedTests",
DROP COLUMN "totalTests",
DROP COLUMN "updatedAt",
ADD COLUMN     "passedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "language",
ADD COLUMN     "language" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TestCase" DROP COLUMN "isHidden",
DROP COLUMN "memoryLimitMb",
DROP COLUMN "timeLimitMs",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isSample" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "Language";

-- CreateTable
CREATE TABLE "SubmissionResult" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "actualOutput" TEXT,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubmissionResult" ADD CONSTRAINT "SubmissionResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionResult" ADD CONSTRAINT "SubmissionResult_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
