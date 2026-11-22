import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  History,
  Lightbulb,
  Pause,
  Play,
  Rocket,
  Sparkles,
  Star,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import CodeEditor from "@/components/ui/CodeEditor";
import ConsolePanel, {
  type LiveEvaluationProgress,
  type SubmissionResultView,
} from "@/components/ui/ConsolePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Markdown } from "@/components/ui/markdown";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Question, Submission, RunResultResponse } from "@/lib/types";
import { getCodeTemplate } from "@/lib/codeTemplates";
import { getProblemMetadata, hasProblemMetadata } from "@/lib/problemMeta";
import {
  ApiError,
  fetchAllQuestions,
  fetchQuestionById,
  fetchUserSubmissions,
  getBookmarkedProblemIds,
  pollForSubmissionResult,
  runCodeAPI,
  submitCodeAPI,
  subscribeToSubmissionStream,
  toggleBookmarkedProblem,
} from "@/lib/api";
import {
  clearDraft,
  consumeForkPayload,
  getDraft,
  getPreferredLanguage,
  saveDraft,
  setPreferredLanguage,
} from "@/lib/drafts";
import {
  formatDateTime,
  formatRelativeTime,
  getDifficultyMeta,
  getModifierKey,
  getStatusMeta,
} from "@/lib/ui";
import { usePageTitle } from "@/lib/usePageTitle";

const LANGUAGES = [
  { value: "python", label: "Python 3" },
  { value: "cpp", label: "C++ 17" },
  { value: "javascript", label: "JavaScript" },
];

type LeftTab = "description" | "hints" | "submissions" | "editorial";

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const modifier = getModifierKey();

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [pastSubmissions, setPastSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [language, setLanguage] = useState(getPreferredLanguage);
  const [code, setCode] = useState("");
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>("description");
  const [revealedHints, setRevealedHints] = useState(0);
  const [copiedExampleIndex, setCopiedExampleIndex] = useState<number | null>(null);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResultResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<string[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveProgress, setLiveProgress] = useState<LiveEvaluationProgress | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResultView | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [leftPanePercent, setLeftPanePercent] = useState(45);
  const [consoleHeight, setConsoleHeight] = useState(280);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const draftTimerRef = useRef<number | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const runActionRef = useRef<() => void>(() => {});
  const submitActionRef = useRef<() => void>(() => {});
  const draftSnapshotRef = useRef({ questionId: "", language: "python", code: "" });

  draftSnapshotRef.current = {
    questionId: question?.id ?? "",
    language,
    code,
  };

  usePageTitle(question?.title ?? "Problem");

  const refreshSubmissions = useCallback(async () => {
    if (!id) return;
    try {
      const { submissions } = await fetchUserSubmissions({ questionId: id, limit: 50 });
      setPastSubmissions(submissions);
    } catch {
      // Keep the existing list if the refresh fails.
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadProblem() {
      if (!id) return;

      const previousDraft = draftSnapshotRef.current;
      if (previousDraft.questionId && previousDraft.questionId !== id) {
        saveDraft(previousDraft.questionId, previousDraft.language, previousDraft.code);
      }

      setLoading(true);
      setLoadError(null);
      setRunResult(null);
      setSubmissionResult(null);
      setSubmitError(null);
      setRunError(null);
      setLiveProgress(null);
      setPollTimedOut(false);
      setCustomInputs([]);
      setRevealedHints(0);
      setActiveLeftTab("description");
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setIsConsoleOpen(true);

      try {
        const [questionData, questionList, submissionList] = await Promise.all([
          fetchQuestionById(id),
          fetchAllQuestions().catch(() => []),
          fetchUserSubmissions({ questionId: id, limit: 50 }).catch(() => ({
            submissions: [] as Submission[],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
          })),
        ]);

        if (cancelled) return;

        setQuestion(questionData);
        setAllQuestions(questionList);
        setPastSubmissions(submissionList.submissions);
        setIsBookmarked(getBookmarkedProblemIds().includes(id));

        if (questionData) {
          const preferred = getPreferredLanguage();
          const nextLanguage = LANGUAGES.some((item) => item.value === preferred)
            ? preferred
            : "python";
          const fork = consumeForkPayload(id);

          if (fork && LANGUAGES.some((item) => item.value === fork.language)) {
            setLanguage(fork.language);
            setPreferredLanguage(fork.language);
            setCode(fork.code);
            saveDraft(id, fork.language, fork.code);
            setDraftStatus("saved");
            toast("Submission loaded into the editor");
          } else {
            const draft = getDraft(id, nextLanguage);
            setLanguage(nextLanguage);
            setCode(draft ?? getCodeTemplate(nextLanguage, id));
            setDraftStatus(draft ? "saved" : "idle");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load the problem.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProblem();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);

      const snapshot = draftSnapshotRef.current;
      if (snapshot.questionId) {
        saveDraft(snapshot.questionId, snapshot.language, snapshot.code);
      }
    };
  }, []);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => setTimerSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning]);

  const persistDraft = useCallback(
    (value: string, lang: string) => {
      if (!question) return;
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
      saveDraft(question.id, lang, value);
      setDraftStatus("saved");
    },
    [question],
  );

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (!question) return;

    setDraftStatus("saving");
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      saveDraft(question.id, language, value);
      setDraftStatus("saved");
    }, 600);
  };

  const handleLanguageChange = (nextLanguage: string) => {
    if (!question || nextLanguage === language) return;

    persistDraft(code, language);
    setPreferredLanguage(nextLanguage);
    setLanguage(nextLanguage);

    const draft = getDraft(question.id, nextLanguage);
    setCode(draft ?? getCodeTemplate(nextLanguage, question.id));
    setDraftStatus(draft ? "saved" : "idle");
    setRunResult(null);
    setSubmissionResult(null);
    setSubmitError(null);
    setRunError(null);
  };

  const handleResetCode = () => {
    if (!question) return;
    const template = getCodeTemplate(language, question.id);

    if (code.trim() !== template.trim()) {
      const confirmed = window.confirm(
        "Reset to the starter code? Your current draft for this language will be replaced.",
      );
      if (!confirmed) return;
    }

    clearDraft(question.id, language);
    setCode(template);
    setDraftStatus("idle");
    toast("Starter code restored");
  };

  const handleToggleBookmark = () => {
    if (!question) return;
    const next = toggleBookmarkedProblem(question.id);
    setIsBookmarked(next);
    toast(next ? "Problem bookmarked" : "Bookmark removed", { description: question.title });
  };

  const handleRunCode = async () => {
    if (!question || isRunning || isSubmitting) return;
    persistDraft(code, language);
    setIsRunning(true);
    setRunResult(null);
    setRunError(null);
    setIsConsoleOpen(true);

    try {
      const result = await runCodeAPI({
        questionId: question.id,
        code,
        language,
        customTestCases: customInputs.length > 0 ? customInputs : undefined,
      });
      setRunResult(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/auth");
        return;
      }
      setRunError(err instanceof Error ? err.message : "Run failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!question || isSubmitting || isRunning) return;

    persistDraft(code, language);
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    setIsSubmitting(true);
    setLiveProgress(null);
    setSubmissionResult(null);
    setSubmitError(null);
    setPollTimedOut(false);
    setIsConsoleOpen(true);

    try {
      const submissionId = await submitCodeAPI({ questionId: question.id, code, language });

      unsubscribeRef.current = subscribeToSubmissionStream(
        submissionId,
        (event) => {
          if (event.type === "compiling") {
            setLiveProgress({ phase: "compiling" });
            return;
          }

          if (event.type === "testcase") {
            setLiveProgress({
              phase: "testcase",
              current: event.current,
              total: event.total,
              passed: event.passed,
            });
            return;
          }

          unsubscribeRef.current?.();
          unsubscribeRef.current = null;
          setLiveProgress(null);
          setIsSubmitting(false);
          setSubmissionResult({
            status: event.status,
            output: event.output,
            passedCount: event.passedCount ?? 0,
            totalCount: event.totalCount ?? 0,
            cases: event.cases,
          });
          refreshSubmissions();

          const meta = getStatusMeta(event.status);
          if (meta.tone === "success") {
            toast.success("Accepted", {
              description: `${event.passedCount ?? 0} / ${event.totalCount ?? 0} test cases passed`,
            });
          }
        },
        async () => {
          try {
            const result = await pollForSubmissionResult(submissionId);
            if (result) {
              setSubmissionResult({
                status: result.status,
                output: result.output,
                passedCount: result.passedCount,
                totalCount: result.totalCount,
                cases: result.results.map((item) => ({
                  passed: item.passed,
                  timedOut: item.timedOut,
                })),
              });
              refreshSubmissions();
            } else {
              setPollTimedOut(true);
            }
          } finally {
            setIsSubmitting(false);
            setLiveProgress(null);
          }
        },
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/auth");
        return;
      }
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
      setIsSubmitting(false);
      setLiveProgress(null);
    }
  };

  runActionRef.current = handleRunCode;
  submitActionRef.current = handleSubmitCode;

  const shortcutGuardRef = useRef({ run: 0, submit: 0 });

  const runFromShortcut = () => {
    const now = performance.now();
    if (now - shortcutGuardRef.current.run < 120) return;
    shortcutGuardRef.current.run = now;
    runActionRef.current();
  };

  const submitFromShortcut = () => {
    const now = performance.now();
    if (now - shortcutGuardRef.current.submit < 120) return;
    shortcutGuardRef.current.submit = now;
    submitActionRef.current();
  };

  const shortcutActionsRef = useRef({ run: runFromShortcut, submit: submitFromShortcut });
  shortcutActionsRef.current = { run: runFromShortcut, submit: submitFromShortcut };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;

      if (event.key === "Enter") {
        event.preventDefault();
        shortcutActionsRef.current.submit();
      } else if (event.key === "'") {
        event.preventDefault();
        shortcutActionsRef.current.run();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingH && workspaceRef.current) {
        const rect = workspaceRef.current.getBoundingClientRect();
        const nextPercent = ((event.clientX - rect.left) / rect.width) * 100;
        if (nextPercent >= 28 && nextPercent <= 72) {
          setLeftPanePercent(nextPercent);
        }
      } else if (isDraggingV && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const nextHeight = rect.bottom - event.clientY;
        if (nextHeight >= 140 && nextHeight <= 520) {
          setConsoleHeight(nextHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingH(false);
      setIsDraggingV(false);
    };

    if (isDraggingH || isDraggingV) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingH, isDraggingV]);

  const currentIndex = allQuestions.findIndex((item) => item.id === id);
  const prevQuestion = currentIndex > 0 ? allQuestions[currentIndex - 1] : null;
  const nextQuestion =
    currentIndex >= 0 && currentIndex < allQuestions.length - 1
      ? allQuestions[currentIndex + 1]
      : null;

  const isSolved = pastSubmissions.some(
    (submission) => submission.status === "Success" || submission.status === "Accepted",
  );
  const hasAttempted = pastSubmissions.length > 0;
  const difficulty = getDifficultyMeta(question?.difficulty);
  const metadata = getProblemMetadata(question?.id);
  const showEditorial = hasProblemMetadata(question?.id);
  const sampleCases = question?.testCases?.filter((testCase) => testCase.isSample) ?? [];

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-base font-sans text-text-primary">
        <div className="border-b border-border-hairline px-6 py-4">
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid min-h-[calc(100dvh-64px)] grid-cols-2">
          <div className="space-y-4 border-r border-border-hairline p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="p-4">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-base px-4 font-sans">
        <EmptyState
          icon={AlertTriangle}
          title={loadError ? "Could not load this problem" : "Problem not found"}
          description={
            loadError ?? "The problem you are looking for does not exist or is no longer available."
          }
          action={
            <Button variant="secondary" asChild>
              <Link to="/">
                <ArrowLeft />
                Back to problems
              </Link>
            </Button>
          }
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-dvh flex-col overflow-hidden bg-surface-base font-sans text-text-primary ${
        isDraggingH || isDraggingV ? "select-none" : ""
      }`}
    >
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-hairline bg-surface-elevated px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <div className="flex items-center rounded border border-border-hairline bg-surface-base">
            {prevQuestion ? (
              <Link
                to={`/problem/${prevQuestion.id}`}
                title={`Previous: ${prevQuestion.title}`}
                aria-label={`Previous problem: ${prevQuestion.title}`}
                className="rounded p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="p-1 text-text-muted/30">
                <ChevronLeft className="h-3.5 w-3.5" />
              </span>
            )}
            {nextQuestion ? (
              <Link
                to={`/problem/${nextQuestion.id}`}
                title={`Next: ${nextQuestion.title}`}
                aria-label={`Next problem: ${nextQuestion.title}`}
                className="rounded p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="p-1 text-text-muted/30">
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate font-display text-sm font-medium tracking-tight text-text-primary">
              {currentIndex >= 0 ? `${currentIndex + 1}. ` : ""}
              {question.title}
            </h1>
            <Badge variant={difficulty.tone} className="hidden shrink-0 sm:inline-flex">
              {difficulty.label}
            </Badge>
            {isSolved ? (
              <CheckCircle2
                className="hidden h-3.5 w-3.5 shrink-0 text-status-accepted sm:block"
                aria-label="Solved"
              />
            ) : null}
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-border-hairline bg-surface-base px-2.5 py-1 md:flex">
          <Timer className="h-3.5 w-3.5 text-text-muted" />
          <span className="font-mono text-xs font-medium tabular-nums text-text-primary">
            {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:
            {String(timerSeconds % 60).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setIsTimerRunning((value) => !value)}
            aria-label={isTimerRunning ? "Pause session timer" : "Resume session timer"}
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="hidden font-mono text-[10px] text-text-muted lg:inline"
            aria-live="polite"
          >
            {draftStatus === "saving" ? "Saving…" : draftStatus === "saved" ? "Draft saved" : ""}
          </span>

          <Select
            value={language}
            onChange={(event) => handleLanguageChange(event.target.value)}
            disabled={isSubmitting || isRunning}
            aria-label="Language"
            className="h-7 w-32 text-xs"
          >
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
          >
            <Play className={isRunning ? "animate-spin" : undefined} />
            {isRunning ? "Running" : "Run"}
            <kbd className="hidden font-mono text-[10px] text-text-muted lg:inline">{modifier}'</kbd>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmitCode}
            disabled={isSubmitting || isRunning}
          >
            <Rocket />
            {isSubmitting ? "Submitting" : "Submit"}
            <kbd className="hidden font-mono text-[10px] text-white/70 lg:inline">
              {modifier}↵
            </kbd>
          </Button>
        </div>
      </header>

      {runError || submitError ? (
        <div
          role="alert"
          className="flex shrink-0 items-center gap-2 border-b border-status-error/30 bg-status-error/10 px-4 py-1.5 text-xs text-status-error"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{runError || submitError}</span>
        </div>
      ) : null}

      <div ref={workspaceRef} className="relative flex min-h-0 flex-1 overflow-hidden">
        <section
          style={{ width: `${leftPanePercent}%` }}
          className="flex min-w-[320px] shrink-0 flex-col overflow-hidden border-r border-border-hairline bg-surface-elevated"
          aria-label="Problem details"
        >
          <div
            role="tablist"
            aria-label="Problem panels"
            className="flex h-10 shrink-0 items-center gap-1 border-b border-border-hairline bg-surface-base/60 px-3"
          >
            {[
              { id: "description" as const, label: "Description", icon: FileText },
              { id: "hints" as const, label: "Hints", icon: Lightbulb },
              { id: "submissions" as const, label: "Submissions", icon: History },
              ...(showEditorial
                ? [{ id: "editorial" as const, label: "Approach", icon: Sparkles }]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeLeftTab === tab.id}
                onClick={() => setActiveLeftTab(tab.id)}
                className={`relative flex h-full items-center gap-1.5 px-2 text-xs transition-colors ${
                  activeLeftTab === tab.id
                    ? "font-medium text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === "hints" ? (
                  <span className="font-mono text-[10px] text-text-muted">{metadata.hints.length}</span>
                ) : null}
                {tab.id === "submissions" ? (
                  <span className="font-mono text-[10px] text-text-muted">
                    {pastSubmissions.length}
                  </span>
                ) : null}
                {activeLeftTab === tab.id ? (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] bg-primary-container" />
                ) : null}
              </button>
            ))}
          </div>

          <div className="flex-1 select-text overflow-y-auto p-5 text-sm text-text-secondary">
            {activeLeftTab === "description" ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary">
                      {question.title}
                    </h2>
                    <button
                      type="button"
                      onClick={handleToggleBookmark}
                      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark problem"}
                      aria-pressed={isBookmarked}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-surface-base hover:text-status-warning"
                    >
                      <Star className={`h-4 w-4 ${isBookmarked ? "fill-current text-status-warning" : ""}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={difficulty.tone}>{difficulty.label}</Badge>
                    {isSolved ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3" />
                        Solved
                      </Badge>
                    ) : hasAttempted ? (
                      <Badge variant="warning">
                        <Clock className="h-3 w-3" />
                        Attempted
                      </Badge>
                    ) : null}
                    <span className="text-text-muted">{question.category ?? "Uncategorized"}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-muted">{sampleCases.length} sample cases</span>
                  </div>
                </div>

                <div className="border-t border-border-hairline pt-4">
                  <Markdown content={question.description} />
                </div>

                {sampleCases.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Examples
                    </h3>
                    {sampleCases.map((testCase, index) => (
                      <div
                        key={testCase.id || index}
                        className="space-y-2 rounded-md border border-border-hairline bg-surface-base p-3.5 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-xs font-medium text-text-primary">
                            Example {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(testCase.input);
                              setCopiedExampleIndex(index);
                              setTimeout(() => setCopiedExampleIndex(null), 1500);
                            }}
                            className="flex items-center gap-1 font-sans text-[11px] text-text-muted transition-colors hover:text-text-primary"
                          >
                            {copiedExampleIndex === index ? (
                              <>
                                <Check className="h-3 w-3 text-status-accepted" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy input
                              </>
                            )}
                          </button>
                        </div>

                        <div className="space-y-1 rounded border border-border-hairline bg-surface-elevated/60 p-2.5">
                          <div>
                            <span className="select-none text-text-muted">Input: </span>
                            <span className="font-semibold text-text-primary">{testCase.input}</span>
                          </div>
                          <div>
                            <span className="select-none text-text-muted">Output: </span>
                            <span className="font-semibold text-status-accepted">
                              {testCase.expectedOutput}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeLeftTab === "hints" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-text-primary">Hints</h3>
                  <p className="mt-1 text-xs text-text-muted">
                    Reveal hints one at a time if you get stuck.
                  </p>
                </div>

                <div className="space-y-2">
                  {metadata.hints.slice(0, revealedHints).map((hint, index) => (
                    <div
                      key={index}
                      className="space-y-1 rounded-md border border-border-hairline bg-surface-base p-3.5"
                    >
                      <p className="font-mono text-[11px] font-medium text-status-warning">
                        Hint {index + 1}
                      </p>
                      <p className="text-xs leading-6 text-text-secondary">{hint}</p>
                    </div>
                  ))}
                </div>

                {revealedHints < metadata.hints.length ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRevealedHints((value) => value + 1)}
                  >
                    <Lightbulb />
                    {revealedHints === 0 ? "Reveal first hint" : "Reveal next hint"}
                  </Button>
                ) : (
                  <p className="text-xs text-text-muted">All hints revealed.</p>
                )}
              </div>
            ) : null}

            {activeLeftTab === "submissions" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-text-primary">
                    Your submissions
                  </h3>
                  <span className="text-xs text-text-muted">
                    {pastSubmissions.length} shown
                  </span>
                </div>

                {pastSubmissions.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No submissions yet"
                    description="Submit a solution to see your verdicts and previous code here."
                    className="bg-surface-base"
                  />
                ) : (
                  <div className="space-y-2">
                    {pastSubmissions.map((submission) => {
                      const meta = getStatusMeta(submission.status);
                      return (
                        <div
                          key={submission.id}
                          className="space-y-2 rounded-md border border-border-hairline bg-surface-base p-3.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={meta.tone}>{meta.label}</Badge>
                              <span className="font-mono text-[10px] uppercase text-text-muted">
                                {submission.language}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-text-muted">
                              {submission.passedCount}/{submission.totalCount}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2 text-[11px] text-text-muted">
                            <span title={formatDateTime(submission.createdAt)}>
                              {formatRelativeTime(submission.createdAt)}
                            </span>
                            {submission.code ? (
                              <button
                                type="button"
                                onClick={() => {
                                  persistDraft(code, language);
                                  setLanguage(submission.language);
                                  setPreferredLanguage(submission.language);
                                  setCode(submission.code);
                                  saveDraft(question.id, submission.language, submission.code);
                                  setDraftStatus("saved");
                                  toast("Submission loaded into the editor");
                                }}
                                className="text-primary transition-colors hover:text-text-primary"
                              >
                                Load code
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {activeLeftTab === "editorial" && showEditorial ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Approach
                  </p>
                  <h3 className="mt-1 font-display text-base font-semibold text-text-primary">
                    {metadata.approach}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 rounded-md border border-border-hairline bg-surface-base p-3">
                    <span className="text-[10px] uppercase tracking-wide text-text-muted">
                      Time complexity
                    </span>
                    <p className="font-mono text-sm font-semibold text-status-accepted">
                      {metadata.timeComplexity}
                    </p>
                  </div>
                  <div className="space-y-1 rounded-md border border-border-hairline bg-surface-base p-3">
                    <span className="text-[10px] uppercase tracking-wide text-text-muted">
                      Space complexity
                    </span>
                    <p className="font-mono text-sm font-semibold text-tertiary">
                      {metadata.spaceComplexity}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-md border border-border-hairline bg-surface-base p-4">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    Explanation
                  </h4>
                  <p className="whitespace-pre-line text-xs leading-6 text-text-secondary">
                    {metadata.explanation}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize problem and editor panes"
          onMouseDown={(event) => {
            event.preventDefault();
            setIsDraggingH(true);
          }}
          className="z-20 flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border-hairline transition-colors hover:bg-primary-container/40"
        >
          <div className="h-8 w-0.5 rounded-full bg-white/20" />
        </div>

        <section
          ref={rightPaneRef}
          style={{ width: `${100 - leftPanePercent}%` }}
          className="relative flex min-w-0 flex-col overflow-hidden bg-surface-base"
          aria-label="Code editor"
        >
          <div className="min-h-0 flex-1 p-2">
            <CodeEditor
              code={code}
              onChange={handleCodeChange}
              language={language}
              onRun={runFromShortcut}
              onSubmit={submitFromShortcut}
              onReset={handleResetCode}
              disabled={isSubmitting || isRunning}
            />
          </div>

          {isConsoleOpen ? (
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize console"
              onMouseDown={(event) => {
                event.preventDefault();
                setIsDraggingV(true);
              }}
              className="z-20 flex h-1.5 shrink-0 cursor-row-resize items-center justify-center bg-border-hairline transition-colors hover:bg-primary-container/40"
            >
              <div className="h-0.5 w-8 rounded-full bg-white/20" />
            </div>
          ) : null}

          <div
            style={isConsoleOpen ? { height: `${consoleHeight}px` } : undefined}
            className="shrink-0 px-2 pb-2"
          >
            <ConsolePanel
              testCases={question.testCases ?? []}
              isRunning={isRunning}
              runResult={runResult}
              isSubmitting={isSubmitting}
              liveProgress={liveProgress}
              submissionResult={submissionResult}
              pollTimedOut={pollTimedOut}
              customInputs={customInputs}
              onCustomInputsChange={setCustomInputs}
              isOpen={isConsoleOpen}
              onToggleOpen={() => setIsConsoleOpen((value) => !value)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
