/*
  Warnings:

  - Added the required column `updatedAt` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `language` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('CPP', 'PYTHON', 'JAVASCRIPT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubmissionStatus" ADD VALUE 'RE';
ALTER TYPE "SubmissionStatus" ADD VALUE 'CE';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "executionTime" INTEGER,
ADD COLUMN     "memoryUsed" INTEGER,
ADD COLUMN     "passedTests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL;

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT true,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 1000,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 256,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
