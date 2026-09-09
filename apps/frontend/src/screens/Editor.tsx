import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Send, FileText, History, AlertTriangle } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/ui/CodeEditor";
import ConsolePanel from "@/components/ui/ConsolePanel";
import type { Question, Submission, SubmissionStatus } from "@/lib/types";
import { getCodeTemplate } from "@/lib/codeTemplates";
import {
  ApiError,
  fetchQuestionById,
  fetchUserSubmissions,
  pollForSubmissionResult,
  submitCodeAPI,
} from "@/lib/api";

// Must match apps/worker/index.ts's EXTENSION_BY_LANGUAGE — anything else
// submitted comes back as "Failure" immediately.
const LANGUAGES = [
  { value: "python", label: "Python 3" },
  { value: "cpp", label: "C++ 17" },
  { value: "javascript", label: "JavaScript (Node)" },
];

interface SubmissionResultView {
  status: SubmissionStatus;
  output?: string | null;
  passedCount?: number;
  totalCount?: number;
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(getCodeTemplate("python"));
  const [activeLeftTab, setActiveLeftTab] = useState<"description" | "submissions">("description");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResultView | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [pastSubmissions, setPastSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    async function loadQuestion() {
      if (!id) return;
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchQuestionById(id);
        setQuestion(data);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load problem.");
      } finally {
        setLoading(false);
      }
    }
    loadQuestion();
  }, [id]);

  // Load this question's submission history lazily, the first time the tab is opened.
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

  const handleLanguageChange = (newLang: string) => {
    const currentTemplate = getCodeTemplate(language);
    const hasUserEdits = code !== currentTemplate;

    if (hasUserEdits) {
      const confirmed = window.confirm(
        "You have unsaved changes in your code. Switching languages will replace your current code with a new template.\n\nDo you want to continue?"
      );
      if (!confirmed) return;
    }

    setLanguage(newLang);
    setCode(getCodeTemplate(newLang));
  };

  const handleResetCode = () => {
    setCode(getCodeTemplate(language));
  };

  const handleSubmitCode = async () => {
    if (!question || isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionResult(null);
    setSubmitError(null);
    setPollTimedOut(false);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090a0f] text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-circuit border-t-transparent" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#090a0f] text-neutral-400 gap-3">
        <AlertTriangle className="h-6 w-6 text-fail" />
        <p className="text-lg font-semibold text-white">
          {loadError ? "Couldn't load this problem" : "Problem not found"}
        </p>
        {loadError && <p className="text-sm text-neutral-500 max-w-sm text-center">{loadError}</p>}
        <Link to="/" className="mt-2 text-sm text-circuit underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#090a0f] text-neutral-200 font-sans overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-neutral-800 bg-[#11131c] px-4 select-none">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Problems
          </Link>
          <div className="h-4 w-px bg-neutral-800" />
          <h1 className="font-display text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">{question.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={isSubmitting}
            className="h-8 rounded-lg border border-neutral-800 bg-[#181a24] px-3 text-xs font-semibold text-neutral-200 focus:border-circuit focus:outline-none cursor-pointer disabled:opacity-50"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            onClick={handleSubmitCode}
            disabled={isSubmitting}
            className="h-8 rounded-lg bg-pass text-xs font-semibold text-white shadow-sm shadow-pass/30 hover:bg-pass/90 active:scale-[0.98]"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </header>

      {submitError && (
        <div className="flex items-center gap-2 bg-fail/10 border-b border-fail/20 px-4 py-2 text-xs text-fail">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Main Dual-Pane Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANE: Problem Specs & Submissions */}
        <div className="flex w-1/2 flex-col border-r border-neutral-800 bg-[#0e1017] overflow-hidden">
          <div className="flex h-10 shrink-0 items-center gap-1 border-b border-neutral-800 bg-[#141622] px-4 select-none">
            <button
              onClick={() => setActiveLeftTab("description")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeLeftTab === "description"
                  ? "bg-neutral-800 text-white font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-circuit" />
              Description
            </button>

            <button
              onClick={() => setActiveLeftTab("submissions")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeLeftTab === "submissions"
                  ? "bg-neutral-800 text-white font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <History className="h-3.5 w-3.5 text-pass" />
              Submissions
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-300 leading-relaxed">
            {activeLeftTab === "description" ? (
              <div className="space-y-6">
                <h2 className="font-display text-2xl font-semibold text-white tracking-tight">{question.title}</h2>

                <div className="whitespace-pre-line text-sm leading-relaxed text-neutral-300">
                  {question.description}
                </div>

                {question.testCases && question.testCases.some((tc) => tc.isSample) && (
                  <div className="space-y-4 pt-4 border-t border-neutral-800">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Examples
                    </h3>
                    {question.testCases
                      .filter((tc) => tc.isSample)
                      .map((tc, index) => (
                        <div
                          key={tc.id || index}
                          className="rounded-xl border border-neutral-800 bg-[#12141d] p-4 space-y-2 font-mono text-xs"
                        >
                          <p className="text-xs font-sans font-semibold text-circuit">
                            Example {index + 1}:
                          </p>
                          <div>
                            <span className="text-neutral-500 font-sans">Input:</span>{" "}
                            <span className="text-neutral-200">{tc.input}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 font-sans">Output:</span>{" "}
                            <span className="text-pass">{tc.expectedOutput}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">Your Past Submissions</h3>
                {submissionsLoading ? (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-circuit border-t-transparent" />
                    Loading...
                  </div>
                ) : pastSubmissions.length === 0 ? (
                  <p className="text-neutral-500">No submissions yet for this problem.</p>
                ) : (
                  <div className="space-y-3">
                    {pastSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-xl border border-neutral-800 bg-[#12141d] p-3.5"
                      >
                        <div className="space-y-1">
                          <span
                            className={`text-xs font-bold ${
                              sub.status === "Success" ? "text-pass" : "text-fail"
                            }`}
                          >
                            {sub.status === "Success" ? "Accepted" : sub.status}
                          </span>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            {sub.language} • {new Date(sub.createdAt).toLocaleString()}
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

        {/* RIGHT PANE: Code Editor & Console */}
        <div className="flex w-1/2 flex-col bg-[#0c0d12] overflow-hidden">
          <div className="flex-1 p-2 overflow-hidden">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onSubmit={handleSubmitCode}
              onReset={handleResetCode}
              disabled={isSubmitting}
            />
          </div>

          <ConsolePanel
            testCases={question.testCases || []}
            isSubmitting={isSubmitting}
            submissionResult={submissionResult}
            pollTimedOut={pollTimedOut}
          />
        </div>
      </div>
    </div>
  );
}