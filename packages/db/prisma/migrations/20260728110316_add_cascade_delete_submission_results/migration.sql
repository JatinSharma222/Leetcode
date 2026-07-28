-- DropForeignKey
ALTER TABLE "SubmissionResult" DROP CONSTRAINT "SubmissionResult_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "SubmissionResult" DROP CONSTRAINT "SubmissionResult_testCaseId_fkey";

-- AddForeignKey
ALTER TABLE "SubmissionResult" ADD CONSTRAINT "SubmissionResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionResult" ADD CONSTRAINT "SubmissionResult_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
