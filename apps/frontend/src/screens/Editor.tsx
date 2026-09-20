import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  Play,
  FileText,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Tag,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/ui/CodeEditor";
import ConsolePanel, { type SubmissionResultView } from "@/components/ui/ConsolePanel";
import type { Question, Submission, RunResultResponse } from "@/lib/types";
import { getCodeTemplate } from "@/lib/codeTemplates";
import {
  ApiError,
  fetchQuestionById,
  fetchQuestions,
  fetchUserSubmissions,
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
  "sum-two-numbers": { label: "Easy", color: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20" },
  "reverse-string": { label: "Easy", color: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20" },
  fizzbuzz: { label: "Easy", color: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20" },
  "palindrome-check": { label: "Easy", color: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20" },
  factorial: { label: "Medium", color: "text-[#ffc01e]", bg: "bg-[#ffc01e]/10 border-[#ffc01e]/20" },
  "max-in-array": { label: "Easy", color: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20" },
  "gcd-two-numbers": { label: "Medium", color: "text-[#ffc01e]", bg: "bg-[#ffc01e]/10 border-[#ffc01e]/20" },
  "count-vowels": { label: "Easy", color: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20" },
  "two-sum": { label: "Medium", color: "text-[#ffc01e]", bg: "bg-[#ffc01e]/10 border-[#ffc01e]/20" },
  "binary-to-decimal": { label: "Easy", color: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20" },
};

const TOPICS_MAP: Record<string, string[]> = {
  "sum-two-numbers": ["Math", "Basic I/O"],
  "reverse-string": ["Two Pointers", "String"],
  fizzbuzz: ["Math", "Simulation"],
  "palindrome-check": ["Two Pointers", "String"],
  factorial: ["Math", "Recursion"],
  "max-in-array": ["Array", "Linear Search"],
  "gcd-two-numbers": ["Math", "Euclidean Algorithm"],
  "count-vowels": ["String", "Hash Table"],
  "two-sum": ["Array", "Hash Table"],
  "binary-to-decimal": ["Math", "Bit Manipulation"],
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
  const [activeLeftTab, setActiveLeftTab] = useState<"description" | "submissions">("description");

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
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
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
          setSubmissionResult(null);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load problem.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Load submissions lazily
  useEffect(() => {
    if (activeLeftTab !== "submissions" || !id) return;
    let cancelled = false;

    async function loadSubmissions() {
      setSubmissionsLoading(true);
      try {
        const all = await fetchUserSubmissions();
        if (!cancelled) setPastSubmissions(all.filter((s) => s.questionId === id));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) navigate("/auth");
      } finally {
        if (!cancelled) setSubmissionsLoading(false);
      }
    }

    loadSubmissions();
    return () => {
      cancelled = true;
    };
  }, [activeLeftTab, id, navigate]);

  // Horizontal Resize Handlers (between Left and Right Panes)
  const handleMouseDownH = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingH(true);
  }, []);

  // Vertical Resize Handlers (between Code Editor and Console)
  const handleMouseDownV = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingV(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingH && workspaceRef.current) {
        const rect = workspaceRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const totalWidth = rect.width;
        let newPercent = (offsetX / totalWidth) * 100;
        if (newPercent < 25) newPercent = 25;
        if (newPercent > 75) newPercent = 75;
        setLeftPanePercent(newPercent);
      } else if (isDraggingV && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const newHeight = rect.bottom - e.clientY;
        if (newHeight >= 120 && newHeight <= rect.height - 120) {
          setConsoleHeight(newHeight);
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
    const currentTpl = getCodeTemplate(language, question?.id);
    const hasUserEdits = code.trim() !== currentTpl.trim();

    if (hasUserEdits) {
      const confirmed = window.confirm(
        "You have modified the code. Switching language will load a new template.\n\nDo you want to switch?",
      );
      if (!confirmed) return;
    }

    setLanguage(newLang);
    setCode(getCodeTemplate(newLang, question?.id));
  };

  const handleResetCode = () => {
    setCode(getCodeTemplate(language, question?.id));
  };

  // Run Code (Interactive Fast-path)
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

  // Submit Code (Final DB Evaluation)
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

  // Keyboard shortcut listeners (global fallback if editor unfocused)
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

  const diff = question?.id ? DIFFICULTY_MAP[question.id] || { label: "Easy", color: "text-[#00b8a3]", bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20" } : null;
  const topics = question?.id ? TOPICS_MAP[question.id] || ["Algorithms"] : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f12] text-neutral-400 font-sans">
        <div className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f12] text-neutral-400 gap-3 font-sans">
        <AlertTriangle className="h-7 w-7 text-fail" />
        <p className="text-lg font-semibold text-white">
          {loadError ? "Couldn't load problem" : "Problem not found"}
        </p>
        {loadError && <p className="text-sm text-neutral-500 max-w-sm text-center">{loadError}</p>}
        <Link to="/" className="mt-2 text-sm text-primary hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex h-screen flex-col bg-[#0f0f12] text-neutral-200 font-sans overflow-hidden select-none ${isDraggingH || isDraggingV ? "cursor-col-resize select-none" : ""}`}>
      {/* TOP HEADER BAR */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-[#18181c] px-3">
        {/* Left: Navigation & Problem Title */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/80 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            {prevQuestion ? (
              <Link
                to={`/problem/${prevQuestion.id}`}
                title={`Previous: ${prevQuestion.title}`}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="p-1 text-neutral-600 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}

            {nextQuestion ? (
              <Link
                to={`/problem/${nextQuestion.id}`}
                title={`Next: ${nextQuestion.title}`}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="p-1 text-neutral-600 cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-1 truncate">
            <h1 className="font-display text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {question.title}
            </h1>
            {diff && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${diff.bg} ${diff.color}`}>
                {diff.label}
              </span>
            )}
          </div>
        </div>

        {/* Right: Language selector & Actions */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={isSubmitting || isRunning}
            className="h-7.5 rounded-md border border-border bg-secondary px-2.5 text-xs font-semibold text-neutral-200 focus:border-primary focus:outline-none cursor-pointer disabled:opacity-50 font-mono"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="h-7.5 px-3 text-xs font-medium border-border bg-secondary text-neutral-200 hover:text-white hover:bg-neutral-800 active:scale-[0.98]"
          >
            <Play className={`mr-1.5 h-3 w-3 text-neutral-300 fill-current ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Running..." : "Run"}
            <span className="hidden md:inline ml-1 text-[10px] text-neutral-500 font-mono">⌘'</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSubmitCode}
            disabled={isSubmitting || isRunning}
            className="h-7.5 px-3.5 text-xs font-semibold bg-pass hover:bg-pass/90 text-white shadow-sm active:scale-[0.98]"
          >
            <Send className="mr-1.5 h-3 w-3" />
            {isSubmitting ? "Submitting..." : "Submit"}
            <span className="hidden md:inline ml-1 text-[10px] text-emerald-100 font-mono">⌘↵</span>
          </Button>
        </div>
      </header>

      {/* Error alert bar */}
      {(runError || submitError) && (
        <div className="flex items-center gap-2 bg-fail/10 border-b border-fail/20 px-4 py-1.5 text-xs text-fail shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{runError || submitError}</span>
        </div>
      )}

      {/* MAIN DUAL-PANE WORKSPACE WITH RESIZABLE SPLIT */}
      <div ref={workspaceRef} className="flex flex-1 overflow-hidden relative">
        {/* LEFT PANE: Description & Submissions */}
        <div
          style={{ width: `${leftPanePercent}%` }}
          className="flex flex-col border-r border-border bg-[#18181c] overflow-hidden shrink-0"
        >
          {/* Left Tabs bar */}
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-[#141417] px-3 select-none">
            <button
              onClick={() => setActiveLeftTab("description")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeLeftTab === "description"
                  ? "bg-neutral-800 text-white font-semibold shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              Description
            </button>

            <button
              onClick={() => setActiveLeftTab("submissions")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeLeftTab === "submissions"
                  ? "bg-neutral-800 text-white font-semibold shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
              }`}
            >
              <History className="h-3.5 w-3.5 text-pass" />
              Submissions
            </button>
          </div>

          {/* Left Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-neutral-300 leading-relaxed select-text">
            {activeLeftTab === "description" ? (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-white tracking-tight">
                    {question.title}
                  </h2>

                  {/* Difficulty & Topics row */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {diff && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${diff.bg} ${diff.color}`}>
                        {diff.label}
                      </span>
                    )}
                    {topics.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-800/70 border border-neutral-700/60 text-neutral-400 flex items-center gap-1"
                      >
                        <Tag className="h-2.5 w-2.5 text-neutral-500" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="whitespace-pre-line text-sm leading-relaxed text-neutral-200 font-sans border-t border-border pt-4">
                  {question.description}
                </div>

                {/* Sample Examples */}
                {question.testCases && question.testCases.some((tc) => tc.isSample) && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Examples
                    </h3>
                    {question.testCases
                      .filter((tc) => tc.isSample)
                      .map((tc, index) => (
                        <div
                          key={tc.id || index}
                          className="rounded-xl border border-border bg-[#141417] p-3.5 space-y-2 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-semibold text-primary text-xs">
                              Example {index + 1}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(tc.input);
                                setCopiedExampleIndex(index);
                                setTimeout(() => setCopiedExampleIndex(null), 1500);
                              }}
                              className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 font-sans"
                            >
                              {copiedExampleIndex === index ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Input</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="bg-[#0f0f12] p-2.5 rounded-lg border border-border space-y-1.5">
                            <div>
                              <span className="text-neutral-500 font-sans select-none">Input: </span>
                              <span className="text-neutral-200 font-semibold">{tc.input}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 font-sans select-none">Output: </span>
                              <span className="text-pass font-semibold">{tc.expectedOutput}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              /* Submissions History tab */
              <div className="space-y-4 font-sans">
                <h3 className="text-sm font-bold text-white">Your Past Submissions</h3>
                {submissionsLoading ? (
                  <div className="flex items-center gap-2 text-neutral-500 text-xs py-4">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading submissions...
                  </div>
                ) : pastSubmissions.length === 0 ? (
                  <p className="text-neutral-500 text-xs py-4">No submissions yet for this problem.</p>
                ) : (
                  <div className="space-y-2.5">
                    {pastSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-[#141417] p-3 hover:border-neutral-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {sub.status === "Success" ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-pass">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-fail">
                                <XCircle className="h-3.5 w-3.5" />
                                {sub.status === "WrongAnswer" ? "Wrong Answer" : sub.status}
                              </span>
                            )}
                            <span className="text-[10px] text-neutral-500 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                              {sub.language}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 font-mono">
                            {new Date(sub.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={sub.status === "Success" ? "success" : "destructive"}>
                          {sub.passedCount}/{sub.totalCount} Passed
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DRAGGABLE HORIZONTAL SPLIT DIVIDER */}
        <div
          onMouseDown={handleMouseDownH}
          className="w-1.5 hover:w-2 hover:bg-primary/50 bg-border cursor-col-resize z-20 flex items-center justify-center group transition-colors select-none shrink-0"
        >
          <div className="h-8 w-0.5 rounded-full bg-neutral-600 group-hover:bg-primary" />
        </div>

        {/* RIGHT PANE: Code Editor & Console Drawer with Vertical Split */}
        <div
          ref={rightPaneRef}
          style={{ width: `${100 - leftPanePercent}%` }}
          className="flex flex-col bg-[#0f0f12] overflow-hidden relative"
        >
          {/* Editor Area */}
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
              className="h-1.5 hover:h-2 hover:bg-primary/50 bg-border cursor-row-resize z-20 flex items-center justify-center group transition-colors select-none shrink-0"
            >
              <div className="w-8 h-0.5 rounded-full bg-neutral-600 group-hover:bg-primary" />
            </div>
          )}

          {/* Console & Test Results Panel */}
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