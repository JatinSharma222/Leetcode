export type SubmissionStatus = "Processing" | "Success" | "WrongAnswer" | "Failure" | "TLE";

export interface TestCase {
  id: string;
  questionId: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  order: number;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  testCases?: TestCase[];
  _count?: {
    submissions: number;
    testCases: number;
  };
}

export interface Submission {
  id: string;
  questionId: string;
  userId: string;
  code: string;
  language: string;
  status: SubmissionStatus;
  output?: string | null;
  passedCount: number;
  totalCount: number;
  createdAt: string;
}

export interface RunResultCase {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error: string;
  passed: boolean;
  timedOut: boolean;
  durationMs: number;
}

export interface RunResultResponse {
  runId: string;
  status: "Accepted" | "WrongAnswer" | "Failure" | "TLE";
  durationMs: number;
  error?: string;
  cases: RunResultCase[];
}