const DRAFT_STORAGE_KEY = "ateliercode:drafts:v1";
const LANGUAGE_STORAGE_KEY = "ateliercode:language";
export const FORK_STORAGE_KEY = "ateliercode:fork:v1";

type DraftStore = Record<string, Record<string, string>>;

function readDraftStore(): DraftStore {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DraftStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDraftStore(store: DraftStore) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage can be unavailable in private browsing or when quota is exceeded.
  }
}

export function getDraft(questionId: string, language: string): string | null {
  const store = readDraftStore();
  return store[questionId]?.[language] ?? null;
}

export function saveDraft(questionId: string, language: string, code: string) {
  const store = readDraftStore();
  store[questionId] = { ...(store[questionId] ?? {}), [language]: code };
  writeDraftStore(store);
}

export function clearDraft(questionId: string, language: string) {
  const store = readDraftStore();
  const drafts = store[questionId];
  if (!drafts) return;

  delete drafts[language];
  if (Object.keys(drafts).length === 0) {
    delete store[questionId];
  }
  writeDraftStore(store);
}

export function clearQuestionDrafts(questionId: string) {
  const store = readDraftStore();
  delete store[questionId];
  writeDraftStore(store);
}

export function getPreferredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || "python";
  } catch {
    return "python";
  }
}

export function setPreferredLanguage(language: string) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures.
  }
}

export interface ForkPayload {
  questionId: string;
  language: string;
  code: string;
}

export function setForkPayload(payload: ForkPayload) {
  try {
    sessionStorage.setItem(FORK_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

export function consumeForkPayload(questionId: string): ForkPayload | null {
  try {
    const raw = sessionStorage.getItem(FORK_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FORK_STORAGE_KEY);

    const parsed = JSON.parse(raw) as ForkPayload;
    if (!parsed || parsed.questionId !== questionId || typeof parsed.code !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
