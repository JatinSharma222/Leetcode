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

export interface SubmissionResultRecord {
  id: string;
  testCaseId: string;
  passed: boolean;
  timedOut: boolean;
  actualOutput: string | null;
  testCase: {
    id: string;
    isSample: boolean;
    input?: string;
    expectedOutput?: string;
  };
}

export interface SubmissionDetail extends Submission {
  results: SubmissionResultRecord[];
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

export interface SubmissionCaseResult {
  passed: boolean;
  timedOut: boolean;
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
      cases?: SubmissionCaseResult[];
      submission?: Submission;
    };

export interface QuestionListResult {
  questions: Question[];
  pagination: PaginationMetadata;
}

export interface SubmissionListResult {
  submissions: Submission[];
  pagination: PaginationMetadata;
}

export interface UserStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  solvedQuestionIds: string[];
  attemptedQuestionIds: string[];
  solvedCount: number;
  attemptedCount: number;
  totalQuestions: number;
  difficulty: Record<DifficultyLevel, { solved: number; total: number }>;
  activity: Record<string, number>;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  recent7Days: Array<{ date: string; count: number }>;
  languageCounts: Record<string, number>;
  recentSubmissions: number;
}
