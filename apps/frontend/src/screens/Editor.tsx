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
  "sum-two-numbers": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  "reverse-string": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  fizzbuzz: { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  "palindrome-check": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  factorial: { label: "Medium", color: "text-medium", bg: "bg-medium/10 border-medium/30" },
  "max-in-array": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  "gcd-two-numbers": { label: "Medium", color: "text-medium", bg: "bg-medium/10 border-medium/30" },
  "count-vowels": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
  "two-sum": { label: "Medium", color: "text-medium", bg: "bg-medium/10 border-medium/30" },
  "binary-to-decimal": { label: "Easy", color: "text-easy", bg: "bg-easy/10 border-easy/30" },
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
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground font-sans">
        <div className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Preparing workspace...
        </div>
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-muted-foreground gap-3 font-sans">
        <AlertTriangle className="h-7 w-7 text-fail" />
        <p className="font-display text-xl font-bold text-foreground">
          {loadError ? "Challenge Unavailable" : "Challenge not found"}
        </p>
        {loadError && <p className="text-sm text-muted-foreground max-w-sm text-center">{loadError}</p>}
        <Link to="/" className="mt-2 text-sm text-primary font-medium hover:underline">
          Return to Studio
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex h-screen flex-col bg-background text-foreground font-sans overflow-hidden select-none ${isDraggingH || isDraggingV ? "cursor-col-resize select-none" : ""}`}>
      {/* TOP HEADER BAR */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#74100B]/50 bg-[#5D0703] text-[#EEDCC8] px-3 shadow-[0_2px_8px_rgba(93,7,3,0.25)]">
        {/* Left: Navigation & Problem Title */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border border-[#74100B] bg-[#72100B] px-2.5 py-1 text-xs font-medium text-[#EEDCC8] hover:bg-[#83140F] transition-all shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-sans text-xs">Archives</span>
          </Link>

          <div className="flex items-center gap-1 border-l border-[#74100B] pl-2">
            {prevQuestion ? (
              <Link
                to={`/problem/${prevQuestion.id}`}
                title={`Previous: ${prevQuestion.title}`}
                className="p-1 text-[#EEDCC8]/70 hover:text-[#EEDCC8] hover:bg-[#72100B] rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="p-1 text-[#EEDCC8]/30 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}

            {nextQuestion ? (
              <Link
                to={`/problem/${nextQuestion.id}`}
                title={`Next: ${nextQuestion.title}`}
                className="p-1 text-[#EEDCC8]/70 hover:text-[#EEDCC8] hover:bg-[#72100B] rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="p-1 text-[#EEDCC8]/30 cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-1 truncate">
            <h1 className="font-display text-base font-bold text-[#EEDCC8] tracking-wide truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {question.title}
            </h1>
            {diff && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${diff.bg} ${diff.color}`}>
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
            className="h-7.5 rounded-md border border-[#74100B] bg-[#4B0502] px-2.5 text-xs font-semibold text-[#EEDCC8] focus:outline-none cursor-pointer disabled:opacity-50 font-mono shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="h-7.5 px-3 text-xs font-medium"
          >
            <Play className={`mr-1.5 h-3 w-3 text-foreground fill-current ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Running..." : "Run"}
            <span className="hidden md:inline ml-1 text-[10px] text-muted-foreground font-mono">⌘'</span>
          </Button>

          <Button
            size="sm"
            variant="default"
            onClick={handleSubmitCode}
            disabled={isSubmitting || isRunning}
            className="h-7.5 px-3.5 text-xs font-semibold bg-[#7A120D] text-[#EEDCC8] border-b-2 border-[#540A06] hover:bg-[#8E1913]"
          >
            <Send className="mr-1.5 h-3 w-3" />
            {isSubmitting ? "Submitting..." : "Submit"}
            <span className="hidden md:inline ml-1 text-[10px] text-[#EEDCC8]/80 font-mono">⌘↵</span>
          </Button>
        </div>
      </header>

      {/* Error alert bar */}
      {(runError || submitError) && (
        <div className="flex items-center gap-2 bg-fail/10 border-b border-fail/30 px-4 py-1.5 text-xs text-fail shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{runError || submitError}</span>
        </div>
      )}

      {/* MAIN DUAL-PANE WORKSPACE WITH RESIZABLE SPLIT */}
      <div ref={workspaceRef} className="flex flex-1 overflow-hidden relative">
        {/* LEFT PANE: Description & Submissions */}
        <div
          style={{ width: `${leftPanePercent}%` }}
          className="flex flex-col border-r border-border bg-card overflow-hidden shrink-0 shadow-sm"
        >
          {/* Left Tabs bar */}
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-secondary/50 px-3 select-none">
            <button
              onClick={() => setActiveLeftTab("description")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeLeftTab === "description"
                  ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              Description
            </button>

            <button
              onClick={() => setActiveLeftTab("submissions")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeLeftTab === "submissions"
                  ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-3.5 w-3.5 text-pass" />
              Submissions
            </button>
          </div>

          {/* Left Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-foreground leading-relaxed select-text">
            {activeLeftTab === "description" ? (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                    {question.title}
                  </h2>

                  {/* Difficulty & Topics row */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {diff && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${diff.bg} ${diff.color}`}>
                        {diff.label}
                      </span>
                    )}
                    {topics.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-secondary/70 border border-border/60 text-muted-foreground flex items-center gap-1"
                      >
                        <Tag className="h-2.5 w-2.5 text-muted-foreground/70" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="whitespace-pre-line text-sm leading-relaxed text-foreground font-sans border-t border-border/60 pt-4">
                  {question.description}
                </div>

                {/* Sample Examples */}
                {question.testCases && question.testCases.some((tc) => tc.isSample) && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                      Curated Examples
                    </h3>
                    {question.testCases
                      .filter((tc) => tc.isSample)
                      .map((tc, index) => (
                        <div
                          key={tc.id || index}
                          className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2 font-mono text-xs shadow-xs"
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
                              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-sans cursor-pointer"
                            >
                              {copiedExampleIndex === index ? (
                                <>
                                  <Check className="h-3 w-3 text-pass" />
                                  <span className="text-pass">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Input</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="bg-background/80 p-2.5 rounded-lg border border-border space-y-1.5 shadow-[inset_0_1px_2px_rgba(93,7,3,0.04)]">
                            <div>
                              <span className="text-muted-foreground font-sans select-none">Input: </span>
                              <span className="text-foreground font-semibold">{tc.input}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground font-sans select-none">Output: </span>
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
                <h3 className="font-display text-lg font-bold text-foreground">Past Evaluations</h3>
                {submissionsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs py-4">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Retrieving submissions...
                  </div>
                ) : pastSubmissions.length === 0 ? (
                  <p className="text-muted-foreground text-xs py-4">No submissions recorded yet for this challenge.</p>
                ) : (
                  <div className="space-y-2.5">
                    {pastSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 hover:border-primary/40 transition-colors shadow-xs"
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
                            <span className="text-[10px] text-muted-foreground font-mono bg-secondary/80 border border-border px-1.5 py-0.5 rounded">
                              {sub.language}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">
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
          className="w-1.5 hover:w-2 hover:bg-primary/40 bg-border cursor-col-resize z-20 flex items-center justify-center group transition-colors select-none shrink-0"
        >
          <div className="h-8 w-0.5 rounded-full bg-border group-hover:bg-primary" />
        </div>

        {/* RIGHT PANE: Code Editor & Console Drawer with Vertical Split */}
        <div
          ref={rightPaneRef}
          style={{ width: `${100 - leftPanePercent}%` }}
          className="flex flex-col bg-background overflow-hidden relative"
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
              className="h-1.5 hover:h-2 hover:bg-primary/40 bg-border cursor-row-resize z-20 flex items-center justify-center group transition-colors select-none shrink-0"
            >
              <div className="w-8 h-0.5 rounded-full bg-border group-hover:bg-primary" />
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