export type SubmissionStatus =
  | "Processing"
  | "Success"
  | "Accepted"
  | "WrongAnswer"
  | "Failure"
  | "TLE"
  | "MLE"
  | "CompileError"
  | "RuntimeError";

export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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
  difficulty?: DifficultyLevel;
  category?: string | null;
  createdAt?: string;
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
  question?: {
    id: string;
    title: string;
    difficulty?: DifficultyLevel;
  };
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
  status: "Accepted" | "WrongAnswer" | "Failure" | "TLE" | "MLE" | "CompileError" | "RuntimeError" | "Success";
  durationMs: number;
  output?: string;
  error?: string;
  executionTimeMs?: number;
  cases: RunResultCase[];
}

export type SubmissionStreamEvent =
  | { type: "compiling" }
  | { type: "testcase"; current: number; total: number; passed: boolean; durationMs: number }
  | {
      type: "completed";
      status: SubmissionStatus;
      passedCount?: number;
      totalCount?: number;
      output?: string;
      error?: string;
      submission?: Submission;
    };