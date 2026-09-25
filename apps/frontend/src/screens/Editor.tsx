import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Rocket,
  FileText,
  Lightbulb,
  History,
  MessagesSquare,
  Star,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Pause,
  Timer,
} from "lucide-react";
import CodeEditor from "@/components/ui/CodeEditor";
import ConsolePanel, { type SubmissionResultView } from "@/components/ui/ConsolePanel";
import type { Question, Submission, RunResultResponse } from "@/lib/types";
import { getCodeTemplate } from "@/lib/codeTemplates";
import {
  ApiError,
  fetchQuestionById,
  fetchQuestions,
  pollForSubmissionResult,
  runCodeAPI,
  submitCodeAPI,
} from "@/lib/api";

const LANGUAGES = [
  { value: "python", label: "Python 3" },
  { value: "cpp", label: "C++ 17" },
  { value: "javascript", label: "JavaScript (Node)" },
];

const DIFFICULTY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  "sum-two-numbers": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  "reverse-string": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  fizzbuzz: { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  "palindrome-check": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  factorial: { label: "Medium", color: "text-status-warning", bg: "bg-status-warning/10 border-status-warning/20" },
  "max-in-array": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  "gcd-two-numbers": { label: "Medium", color: "text-status-warning", bg: "bg-status-warning/10 border-status-warning/20" },
  "count-vowels": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
  "two-sum": { label: "Medium", color: "text-status-warning", bg: "bg-status-warning/10 border-status-warning/20" },
  "binary-to-decimal": { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" },
};

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");
  const [activeLeftTab, setActiveLeftTab] = useState<"description" | "hints" | "submissions" | "discussion">("description");
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Stopwatch / Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Run Code state
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResultResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<string[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // Submit Code state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResultView | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [pastSubmissions, setPastSubmissions] = useState<Submission[]>([]);
  const [copiedExampleIndex, setCopiedExampleIndex] = useState<number | null>(null);

  // Resizable Panes State
  const [leftPanePercent, setLeftPanePercent] = useState<number>(45);
  const [consoleHeight, setConsoleHeight] = useState<number>(260);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  // Load question and all questions list
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setLoadError(null);
      try {
        const [qData, list] = await Promise.all([
          fetchQuestionById(id),
          fetchQuestions().catch(() => []),
        ]);
        setQuestion(qData);
        setAllQuestions(list);
        if (qData) {
          setCode(getCodeTemplate(language, qData.id));
          setCustomInputs([]);
          setRunResult(null);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load problem.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, language]);

  // Session timer ticker
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Horizontal splitter handlers
  const handleMouseDownH = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingH(true);
  };

  const handleMouseDownV = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingV(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingH && workspaceRef.current) {
        const rect = workspaceRef.current.getBoundingClientRect();
        const newLeftPercent = ((e.clientX - rect.left) / rect.width) * 100;
        if (newLeftPercent >= 25 && newLeftPercent <= 75) {
          setLeftPanePercent(newLeftPercent);
        }
      } else if (isDraggingV && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const newH = rect.bottom - e.clientY;
        if (newH >= 120 && newH <= 500) {
          setConsoleHeight(newH);
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

  // Language switch
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(getCodeTemplate(newLang, question?.id));
  };

  const handleResetCode = () => {
    setCode(getCodeTemplate(language, question?.id));
  };

  // Run Code
  const handleRunCode = async () => {
    if (!question || isRunning || isSubmitting) return;
    setIsRunning(true);
    setRunResult(null);
    setRunError(null);
    setIsConsoleOpen(true);

    try {
      const res = await runCodeAPI({
        questionId: question.id,
        code,
        language,
        customTestCases: customInputs.length > 0 ? customInputs : undefined,
      });
      setRunResult(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/auth");
        return;
      }
      setRunError(err instanceof Error ? err.message : "Execution failed.");
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code
  const handleSubmitCode = async () => {
    if (!question || isSubmitting || isRunning) return;
    setIsSubmitting(true);
    setSubmissionResult(null);
    setSubmitError(null);
    setPollTimedOut(false);
    setIsConsoleOpen(true);

    try {
      const submissionId = await submitCodeAPI({ questionId: question.id, code, language });
      const result = await pollForSubmissionResult(submissionId);
      if (result) {
        setSubmissionResult({
          status: result.status,
          output: result.output,
          passedCount: result.passedCount,
          totalCount: result.totalCount,
        });
        setPastSubmissions((prev) => [result, ...prev]);
      } else {
        setPollTimedOut(true);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/auth");
        return;
      }
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault();
        handleRunCode();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmitCode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, language, question, isRunning, isSubmitting, customInputs]);

  // Previous and Next Problem
  const currentIndex = allQuestions.findIndex((q) => q.id === id);
  const prevQuestion = currentIndex > 0 ? allQuestions[currentIndex - 1] : null;
  const nextQuestion = currentIndex >= 0 && currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1] : null;
  const diff = question?.id ? DIFFICULTY_MAP[question.id] || { label: "Easy", color: "text-status-accepted", bg: "bg-status-accepted/10 border-status-accepted/20" } : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base text-text-muted font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
          <span>Mounting isolated sandbox workspace...</span>
        </div>
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-base text-text-muted gap-3 font-sans">
        <AlertTriangle className="h-7 w-7 text-status-error" />
        <p className="font-display text-xl font-bold text-text-primary">
          {loadError ? "Challenge Unavailable" : "Challenge not found"}
        </p>
        <Link to="/" className="mt-2 text-xs text-primary-container hover:underline font-mono">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen flex-col bg-surface-base text-text-primary font-sans overflow-hidden select-none ${
        isDraggingH || isDraggingV ? "cursor-col-resize select-none" : ""
      }`}
    >
      {/* 1. SUB-HEADER WORKSPACE BAR (44px) */}
      <header className="h-11 w-full bg-surface-elevated/95 backdrop-blur-md px-4 flex items-center justify-between shadow-sm shrink-0 z-30 border-b border-white/5 select-none">
        {/* Left: Navigation & Problem Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <div className="flex items-center bg-surface-base rounded px-0.5 py-0.5 border border-white/5">
            {prevQuestion ? (
              <Link
                to={`/problem/${prevQuestion.id}`}
                title={`Previous: ${prevQuestion.title}`}
                className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="p-1 text-text-muted/30 cursor-not-allowed">
                <ChevronLeft className="h-3.5 w-3.5" />
              </span>
            )}

            {nextQuestion ? (
              <Link
                to={`/problem/${nextQuestion.id}`}
                title={`Next: ${nextQuestion.title}`}
                className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="p-1 text-text-muted/30 cursor-not-allowed">
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-sm leading-5 text-text-primary font-semibold truncate tracking-tight">
              #{currentIndex + 1}. {question.title}
            </h1>
            {diff && (
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold border ${diff.bg} ${diff.color}`}>
                {diff.label}
              </span>
            )}
          </div>
        </div>

        {/* Center: Interactive Session Clock Widget */}
        <div className="hidden md:flex items-center gap-2 bg-surface-base px-2.5 py-1 rounded-full shadow-inner border border-white/5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-status-accepted opacity-75 ${!isTimerRunning ? "hidden" : ""}`} />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-accepted" />
          </span>

          <div className="flex items-center gap-1.5 font-mono text-xs text-text-primary font-semibold tracking-wider">
            <Timer className="h-3.5 w-3.5 text-text-muted" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsTimerRunning((prev) => !prev)}
            aria-label="Pause/Resume Timer"
            className="text-text-muted hover:text-text-primary ml-0.5 flex items-center cursor-pointer"
          >
            {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>

          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-text-secondary bg-surface-container px-1.5 py-0.5 rounded">
            Interview Mode
          </span>
        </div>

        {/* Right: Language Selector & Run/Submit Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={isSubmitting || isRunning}
            className="h-7.5 rounded bg-surface-base hover:bg-surface-hover text-text-primary font-mono text-xs px-2.5 border border-white/10 focus:outline-none cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleResetCode}
            title="Reset code"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors hidden sm:flex cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Run Action */}
          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-hover hover:bg-surface-container-high text-text-primary text-xs font-medium border border-white/5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Play className={`h-3 w-3 text-text-secondary group-hover:text-status-accepted transition-colors ${isRunning ? "animate-spin" : ""}`} />
            <span>{isRunning ? "Running..." : "Run"}</span>
            <kbd className="hidden sm:inline font-mono text-[10px] text-text-muted bg-surface-base px-1 py-0.5 rounded shadow-xs">
              ⌘'
            </kbd>
          </button>

          {/* Submit Action */}
          <button
            type="button"
            onClick={handleSubmitCode}
            disabled={isSubmitting || isRunning}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary-container hover:bg-brand-wine-deep text-on-primary-container text-xs font-semibold tracking-wide transition-all shadow-[0_0_20px_-3px_rgba(225,29,72,0.45)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Rocket className="h-3 w-3" />
            <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
            <kbd className="hidden sm:inline font-mono text-[10px] text-on-primary-container/80 bg-black/20 px-1 py-0.5 rounded">
              ⌘↵
            </kbd>
          </button>
        </div>
      </header>

      {/* Error alert bar */}
      {(runError || submitError) && (
        <div className="flex items-center gap-2 bg-status-error/10 border-b border-status-error/30 px-4 py-1.5 text-xs text-status-error shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{runError || submitError}</span>
        </div>
      )}

      {/* 2. SPLIT WORKSPACE (Dual Resizable Panes) */}
      <div ref={workspaceRef} className="flex flex-1 overflow-hidden relative">
        {/* LEFT PANE: Problem Dossier */}
        <div
          style={{ width: `${leftPanePercent}%` }}
          className="flex flex-col bg-surface-elevated overflow-hidden shrink-0 border-r border-white/5 shadow-sm"
        >
          {/* Dossier Header Tabs */}
          <div className="h-10 bg-surface-base/80 px-4 flex items-center gap-6 shrink-0 border-b border-white/5 select-none text-xs">
            <button
              type="button"
              onClick={() => setActiveLeftTab("description")}
              className={`relative flex items-center gap-1.5 h-full transition-colors cursor-pointer ${
                activeLeftTab === "description"
                  ? "text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Description</span>
              {activeLeftTab === "description" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-container" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftTab("hints")}
              className={`relative flex items-center gap-1.5 h-full transition-colors cursor-pointer ${
                activeLeftTab === "hints"
                  ? "text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5 text-status-warning" />
              <span>Hints</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-surface-container text-text-muted">
                3
              </span>
              {activeLeftTab === "hints" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-container" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftTab("submissions")}
              className={`relative flex items-center gap-1.5 h-full transition-colors cursor-pointer ${
                activeLeftTab === "submissions"
                  ? "text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <History className="h-3.5 w-3.5 text-status-accepted" />
              <span>Submissions</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-status-accepted/10 text-status-accepted">
                {pastSubmissions.length}
              </span>
              {activeLeftTab === "submissions" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-container" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftTab("discussion")}
              className={`relative flex items-center gap-1.5 h-full transition-colors cursor-pointer ${
                activeLeftTab === "discussion"
                  ? "text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <MessagesSquare className="h-3.5 w-3.5 text-tertiary" />
              <span>Discussion</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-surface-container text-text-muted">
                48
              </span>
              {activeLeftTab === "discussion" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-container" />
              )}
            </button>
          </div>

          {/* Dossier Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm text-text-secondary select-text">
            {activeLeftTab === "description" && (
              <div className="space-y-4">
                {/* Title & Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-text-primary tracking-tight">
                      {question.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsBookmarked((prev) => !prev)}
                      className="text-text-muted hover:text-status-warning transition-colors cursor-pointer"
                      title="Bookmark Problem"
                    >
                      <Star className={`h-4 w-4 ${isBookmarked ? "text-status-warning fill-current" : ""}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs pt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-accepted/10 text-status-accepted font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Solved
                    </span>
                    <span className="text-text-muted">3.2M Submissions</span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-muted">Acceptance: 59.2%</span>
                  </div>
                </div>

                {/* Statement */}
                <div className="whitespace-pre-line text-sm leading-relaxed text-text-primary/90 font-sans border-t border-white/5 pt-3">
                  {question.description}
                </div>

                {/* Curated Examples */}
                {question.testCases && question.testCases.some((tc) => tc.isSample) && (
                  <div className="space-y-3 pt-2">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
                      Curated Test Vectors
                    </h3>
                    {question.testCases
                      .filter((tc) => tc.isSample)
                      .map((tc, index) => (
                        <div
                          key={tc.id || index}
                          className="rounded-xl border border-white/5 bg-surface-base p-3.5 space-y-2 font-mono text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-semibold text-text-primary text-xs">
                              Example {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(tc.input);
                                setCopiedExampleIndex(index);
                                setTimeout(() => setCopiedExampleIndex(null), 1500);
                              }}
                              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary font-sans cursor-pointer"
                            >
                              {copiedExampleIndex === index ? (
                                <>
                                  <Check className="h-3 w-3 text-status-accepted" />
                                  <span className="text-status-accepted">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Input</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="bg-surface-elevated/70 p-2.5 rounded-lg border border-white/5 space-y-1">
                            <div>
                              <span className="text-text-muted select-none">Input: </span>
                              <span className="text-text-primary font-semibold">{tc.input}</span>
                            </div>
                            <div>
                              <span className="text-text-muted select-none">Expected Output: </span>
                              <span className="text-status-accepted font-semibold">{tc.expectedOutput}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* HINTS TAB */}
            {activeLeftTab === "hints" && (
              <div className="space-y-3 font-sans">
                <h3 className="font-display text-base font-bold text-text-primary">Progressive Hints</h3>
                <div className="p-3.5 rounded-xl bg-surface-base border border-white/5 space-y-1">
                  <p className="font-mono text-xs font-semibold text-status-warning">Hint 1: Initial Invariant</p>
                  <p className="text-xs text-text-muted">Consider using two pointers at the boundaries to bound the solution space.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-base border border-white/5 space-y-1">
                  <p className="font-mono text-xs font-semibold text-status-warning">Hint 2: Monotonic State</p>
                  <p className="text-xs text-text-muted">Track the running maximum from both sides to compute subproblem answers in O(1) space.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-base border border-white/5 space-y-1">
                  <p className="font-mono text-xs font-semibold text-status-warning">Hint 3: Boundary Contraction</p>
                  <p className="text-xs text-text-muted">Advance whichever pointer holds the lower boundary constraint to preserve optimal substructure.</p>
                </div>
              </div>
            )}

            {/* SUBMISSIONS TAB */}
            {activeLeftTab === "submissions" && (
              <div className="space-y-3 font-sans">
                <h3 className="font-display text-base font-bold text-text-primary">Submissions History</h3>
                {pastSubmissions.length === 0 ? (
                  <p className="text-xs text-text-muted py-4">No evaluations logged yet for this challenge.</p>
                ) : (
                  <div className="space-y-2">
                    {pastSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-base p-3 hover:border-white/20 transition-colors shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center gap-1 text-xs font-mono font-bold ${
                                sub.status === "Success" ? "text-status-accepted" : "text-status-error"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {sub.status === "Success" ? "Accepted" : sub.status}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono bg-surface-elevated border border-white/5 px-1.5 py-0.5 rounded">
                              {sub.language}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted font-mono">
                            {new Date(sub.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated text-text-primary border border-white/5">
                          {sub.passedCount}/{sub.totalCount} Passed
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DISCUSSION TAB */}
            {activeLeftTab === "discussion" && (
              <div className="space-y-3 font-sans">
                <h3 className="font-display text-base font-bold text-text-primary">Community Paradigms</h3>
                <div className="p-3.5 rounded-xl bg-surface-base border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Optimal O(N) Two-Pointer Approach</span>
                    <span className="font-mono text-status-accepted">⚡ 18ms</span>
                  </div>
                  <p className="text-xs text-text-muted">Instead of pre-allocating prefix and suffix arrays, maintain running peaks as pointers contract inward.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DRAGGABLE HORIZONTAL SPLIT DIVIDER */}
        <div
          onMouseDown={handleMouseDownH}
          className="w-1.5 hover:w-2 hover:bg-primary-container/40 bg-white/5 cursor-col-resize z-20 flex items-center justify-center group transition-colors select-none shrink-0"
        >
          <div className="h-8 w-0.5 rounded-full bg-white/20 group-hover:bg-primary-container" />
        </div>

        {/* RIGHT PANE: Code Editor & Console Drawer */}
        <div
          ref={rightPaneRef}
          style={{ width: `${100 - leftPanePercent}%` }}
          className="flex flex-col bg-surface-base overflow-hidden relative"
        >
          {/* Upper Section: Code Editor */}
          <div className="flex-1 p-2 overflow-hidden min-h-0">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              onReset={handleResetCode}
              disabled={isSubmitting || isRunning}
            />
          </div>

          {/* DRAGGABLE VERTICAL SPLIT DIVIDER */}
          {isConsoleOpen && (
            <div
              onMouseDown={handleMouseDownV}
              className="h-1.5 hover:h-2 hover:bg-primary-container/40 bg-white/5 cursor-row-resize z-20 flex items-center justify-center group transition-colors select-none shrink-0"
            >
              <div className="w-8 h-0.5 rounded-full bg-white/20 group-hover:bg-primary-container" />
            </div>
          )}

          {/* Lower Section: Console Panel Drawer */}
          <div style={isConsoleOpen ? { height: `${consoleHeight}px` } : undefined}>
            <ConsolePanel
              testCases={question.testCases || []}
              isRunning={isRunning}
              runResult={runResult}
              onRun={handleRunCode}
              isSubmitting={isSubmitting}
              submissionResult={submissionResult}
              onSubmit={handleSubmitCode}
              pollTimedOut={pollTimedOut}
              customInputs={customInputs}
              onCustomInputsChange={setCustomInputs}
              isOpen={isConsoleOpen}
              onToggleOpen={() => setIsConsoleOpen((prev) => !prev)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}