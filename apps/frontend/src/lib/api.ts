import type { Question, Submission } from "./types";

const API_BASE_URL = (import.meta as any).env?.BUN_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}


export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

/**
 * Decodes a JWT payload for display purposes only (e.g. showing the
 * username in the navbar). This does NOT verify the signature — it's not a
 * security check, just reading data the server already signed and sent us.
 */
export function decodeJwtPayload(token: string): { userId?: string; username?: string } | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = decodeURIComponent(
      atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  localStorage.setItem("token", token);
  const payload = decodeJwtPayload(token);
  if (payload?.username) {
    localStorage.setItem("username", payload.username);
  }
}

export function clearAuthToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}


async function apiFetch(path: string, init: RequestInit = {}, requireAuth = false): Promise<any> {
  const headers: Record<string, string> = {
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (requireAuth) {
    const token = getAuthToken();
    if (!token) throw new ApiError("Not authenticated", 401);
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (err) {
    throw new ApiError("Couldn't reach the server. Is the backend running?", 0);
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok) {
    if (res.status === 401) clearAuthToken();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status);
  }

  return data;
}


export async function signIn(username: string, password: string): Promise<void> {
  const data = await apiFetch("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (!data?.token) throw new ApiError("Server didn't return an auth token.", 500);
  setAuthToken(data.token);
}

export async function signUp(username: string, password: string): Promise<void> {
  await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}


export async function fetchQuestions(): Promise<Question[]> {
  const data = await apiFetch("/questions");
  return data?.questions ?? [];
}

export async function fetchQuestionById(id: string): Promise<Question | null> {
  try {
    const data = await apiFetch(`/questions/${id}`);
    return data?.question ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ── Submissions ──────────────────────────────────────────────────────────

export async function fetchUserSubmissions(): Promise<Submission[]> {
  const data = await apiFetch("/submission/submissions", {}, true);
  return data?.submissions ?? [];
}

export async function submitCodeAPI(payload: {
  questionId: string;
  code: string;
  language: string;
}): Promise<string> {
  const data = await apiFetch("/submission/submit", { method: "POST", body: JSON.stringify(payload) }, true);
  if (!data?.submissionId) throw new ApiError("Server didn't return a submission ID.", 500);
  return data.submissionId;
}

export async function fetchSubmissionById(id: string): Promise<Submission | null> {
  try {
    const data = await apiFetch(`/submission/${id}`, {}, true);
    return data?.submission ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Poll a specific submission by its ID until it leaves "Processing" status.
 * This eliminates the previous race condition where we scanned all submissions
 * and could accidentally pick up a different submission's result.
 */
export async function pollForSubmissionResult(
  submissionId: string,
  { intervalMs = 1500, timeoutMs = 30000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<Submission | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const submission = await fetchSubmissionById(submissionId);
    if (submission && submission.status !== "Processing") {
      return submission;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}