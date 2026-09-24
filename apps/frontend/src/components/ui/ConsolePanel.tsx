import React, { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  Terminal,
  Clock,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import type { TestCase, SubmissionStatus, RunResultResponse } from "@/lib/types";
import { Badge } from "./badge";
import { Button } from "./button";
import { TestStrip } from "./TestStrip";

export interface SubmissionResultView {
  status: SubmissionStatus;
  output?: string | null;
  passedCount?: number;
  totalCount?: number;
}

interface ConsolePanelProps {
  testCases?: TestCase[];
  isRunning?: boolean;
  runResult?: RunResultResponse | null;
  onRun?: () => void;
  isSubmitting?: boolean;
  submissionResult?: SubmissionResultView | null;
  onSubmit?: () => void;
  pollTimedOut?: boolean;
  customInputs?: string[];
  onCustomInputsChange?: (inputs: string[]) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  Processing: "Processing",
  Success: "Accepted",
  WrongAnswer: "Wrong Answer",
  Failure: "Compile / Runtime Error",
  TLE: "Time Limit Exceeded",
};

export default function ConsolePanel({
  testCases = [],
  isRunning = false,
  runResult = null,
  onRun,
  isSubmitting = false,
  submissionResult = null,
  onSubmit,
  pollTimedOut = false,
  customInputs = [],
  onCustomInputsChange,
  isOpen,
  onToggleOpen,
}: ConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<"testcase" | "runResult" | "subResult">("testcase");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto switch tabs on activity
  useEffect(() => {
    if (isRunning || runResult) {
      setActiveTab("runResult");
    }
  }, [isRunning, runResult]);

  useEffect(() => {
    if (isSubmitting || submissionResult) {
      setActiveTab("subResult");
    }
  }, [isSubmitting, submissionResult]);

  // Combine sample testcases with any custom inputs
  const sampleInputs = testCases.filter((tc) => tc.isSample || true).map((tc) => tc.input);
  const effectiveInputs = customInputs.length > 0 ? customInputs : sampleInputs;

  // Handler for editing an input
  const handleInputChange = (index: number, value: string) => {
    const updated = [...(customInputs.length > 0 ? customInputs : sampleInputs)];
    updated[index] = value;
    onCustomInputsChange?.(updated);
  };

  const handleAddCase = () => {
    const base = customInputs.length > 0 ? customInputs : sampleInputs;
    const nextCase = base.length > 0 ? base[base.length - 1] : "";
    const updated = [...base, nextCase];
    onCustomInputsChange?.(updated);
    setSelectedCaseIdx(updated.length - 1);
  };

  const handleRemoveCase = (index: number) => {
    const base = customInputs.length > 0 ? customInputs : sampleInputs;
    if (base.length <= 1) return;
    const updated = base.filter((_, idx) => idx !== index);
    onCustomInputsChange?.(updated);
    if (selectedCaseIdx >= updated.length) {
      setSelectedCaseIdx(updated.length - 1);
    }
  };

  const handleResetInputs = () => {
    onCustomInputsChange?.(sampleInputs);
    setSelectedCaseIdx(0);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const isAcceptedSub = submissionResult?.status === "Success";
  const isAcceptedRun = runResult?.status === "Accepted";

  const currentRunCase = runResult?.cases?.[selectedCaseIdx] || runResult?.cases?.[0];

  return (
    <div className="flex flex-col border-t border-border bg-card text-foreground font-sans select-none shrink-0 shadow-[0_-2px_10px_rgba(93,7,3,0.04)]">
      {/* Top Toolbar / Header */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-border bg-secondary/40">
        {/* Left: Tab selectors */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleOpen}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-foreground hover:text-primary rounded hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">Console</span>
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          <button
            onClick={() => {
              setActiveTab("testcase");
              if (!isOpen) onToggleOpen();
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "testcase"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Testcase
          </button>

          <button
            onClick={() => {
              setActiveTab("runResult");
              if (!isOpen) onToggleOpen();
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "runResult"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Test Result</span>
            {runResult && (
              <span className={`h-1.5 w-1.5 rounded-full ${isAcceptedRun ? "bg-pass" : "bg-fail"}`} />
            )}
          </button>

          {submissionResult && (
            <button
              onClick={() => {
                setActiveTab("subResult");
                if (!isOpen) onToggleOpen();
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "subResult"
                  ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Submission</span>
              <span className={`h-1.5 w-1.5 rounded-full ${isAcceptedSub ? "bg-pass" : "bg-fail"}`} />
            </button>
          )}
        </div>

        {/* Right: Run Code & Submit Code action buttons */}
        <div className="flex items-center gap-2">
          {onRun && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRun}
              disabled={isRunning || isSubmitting}
              className="h-7 px-3 text-xs font-medium"
            >
              <Play className={`mr-1.5 h-3 w-3 text-foreground fill-current ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "Running..." : "Run"}
              <span className="hidden md:inline ml-1.5 text-[10px] text-muted-foreground font-mono">⌘'</span>
            </Button>
          )}

          {onSubmit && (
            <Button
              size="sm"
              variant="default"
              onClick={onSubmit}
              disabled={isRunning || isSubmitting}
              className="h-7 px-3.5 text-xs font-semibold"
            >
              <Send className="mr-1.5 h-3 w-3" />
              {isSubmitting ? "Evaluating..." : "Submit"}
              <span className="hidden md:inline ml-1.5 text-[10px] text-primary-foreground/80 font-mono">⌘↵</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Console Content Body */}
      {isOpen && (
        <div className="p-4 max-h-72 min-h-48 overflow-y-auto font-mono text-xs leading-relaxed select-text">
          {/* TAB 1: TESTCASE (EDITABLE) */}
          {activeTab === "testcase" && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {effectiveInputs.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCaseIdx(idx)}
                      className={`px-3 py-1 rounded-md text-xs font-medium font-mono transition-all cursor-pointer ${
                        selectedCaseIdx === idx
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border/50"
                      }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={handleAddCase}
                    title="Add custom test case"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span className="font-sans text-[11px]">Add</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {customInputs.length > 0 && (
                    <button
                      onClick={handleResetInputs}
                      title="Reset to default sample test cases"
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset to sample
                    </button>
                  )}

                  {effectiveInputs.length > 1 && (
                    <button
                      onClick={() => handleRemoveCase(selectedCaseIdx)}
                      title="Remove current test case"
                      className="flex items-center gap-1 text-[11px] text-fail/80 hover:text-fail transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete Case
                    </button>
                  )}
                </div>
              </div>

              {/* Input editing card */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider font-mono">
                    Input (stdin)
                  </span>
                  <span className="text-[10px] text-muted-foreground/80">Editable for custom execution</span>
                </div>
                <textarea
                  value={effectiveInputs[selectedCaseIdx] ?? ""}
                  onChange={(e) => handleInputChange(selectedCaseIdx, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background/80 p-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25 shadow-[inset_0_1px_2px_rgba(93,7,3,0.06)] resize-y"
                  placeholder="Enter custom input..."
                />
              </div>

              {testCases[selectedCaseIdx]?.expectedOutput && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider font-mono">
                    Expected Output (sample)
                  </span>
                  <pre className="p-2.5 rounded-lg border border-border bg-background/80 text-pass font-mono text-xs overflow-x-auto">
                    {testCases[selectedCaseIdx]?.expectedOutput}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEST RESULT (RUN CODE) */}
          {activeTab === "runResult" && (
            <div>
              {isRunning ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground font-sans">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs">Executing test vectors in sandbox...</span>
                </div>
              ) : !runResult ? (
                <div className="py-8 text-center text-muted-foreground font-sans text-xs">
                  Click <span className="font-semibold text-foreground">Run</span> (or press <kbd className="rounded bg-secondary border border-border px-1.5 py-0.5 text-foreground font-mono text-[10px]">⌘'</kbd>) to test your solution.
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  {/* Status header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      {isAcceptedRun ? (
                        <div className="flex items-center gap-1.5 text-pass font-semibold text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Accepted
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-fail font-semibold text-sm">
                          <XCircle className="h-4 w-4" />
                          {runResult.status === "WrongAnswer" ? "Wrong Answer" : runResult.status}
                        </div>
                      )}

                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono bg-secondary/80 border border-border px-2 py-0.5 rounded-md">
                        <Zap className="h-3 w-3 text-pending" />
                        {runResult.durationMs} ms
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono">
                      {runResult.cases.filter((c) => c.passed).length} / {runResult.cases.length} cases passed
                    </div>
                  </div>

                  {/* Case tabs */}
                  <div className="flex items-center gap-1.5">
                    {runResult.cases.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCaseIdx(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                          selectedCaseIdx === idx
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border/50"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${c.passed ? "bg-pass" : "bg-fail"}`} />
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Selected case readout */}
                  {currentRunCase && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider font-mono">
                            Input
                          </span>
                          <button
                            onClick={() => handleCopy(currentRunCase.input, "in")}
                            className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {copiedField === "in" ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <pre className="p-2.5 rounded-lg border border-border bg-background/80 text-foreground font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {currentRunCase.input}
                        </pre>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider font-mono">
                            Your Output
                          </span>
                          <pre
                            className={`p-2.5 rounded-lg border font-mono text-xs overflow-x-auto whitespace-pre-wrap ${
                              currentRunCase.passed
                                ? "border-pass/30 bg-pass/10 text-pass"
                                : "border-fail/30 bg-fail/10 text-fail"
                            }`}
                          >
                            {currentRunCase.actualOutput || (
                              <span className="text-muted-foreground/60 italic">&lt;no stdout output&gt;</span>
                            )}
                          </pre>
                        </div>

                        {currentRunCase.expectedOutput && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider font-mono">
                              Expected Output
                            </span>
                            <pre className="p-2.5 rounded-lg border border-border bg-background/80 text-pass font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                              {currentRunCase.expectedOutput}
                            </pre>
                          </div>
                        )}
                      </div>

                      {currentRunCase.error && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-fail uppercase tracking-wider font-mono">
                            Stderr / Diagnostics
                          </span>
                          <pre className="p-2.5 rounded-lg border border-fail/30 bg-fail/10 text-fail font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                            {currentRunCase.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMISSION RESULT (FULL PERSISTENT EVALUATION) */}
          {activeTab === "subResult" && (
            <div>
              {isSubmitting ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground font-sans">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs">Evaluating against all test vectors...</span>
                </div>
              ) : !submissionResult ? (
                <div className="py-8 text-center text-muted-foreground font-sans text-xs">
                  Click <span className="font-semibold text-foreground">Submit</span> to evaluate your solution.
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      {isAcceptedSub ? (
                        <div className="flex items-center gap-1.5 text-pass font-semibold text-base">
                          <CheckCircle2 className="h-5 w-5 text-pass" />
                          Accepted
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-fail font-semibold text-base">
                          <XCircle className="h-5 w-5 text-fail" />
                          {STATUS_LABEL[submissionResult.status]}
                        </div>
                      )}

                      <Badge variant={isAcceptedSub ? "success" : "destructive"}>
                        {submissionResult.passedCount ?? 0} / {submissionResult.totalCount ?? testCases.length} Passed
                      </Badge>
                    </div>
                  </div>

                  <TestStrip
                    total={submissionResult.totalCount ?? testCases.length}
                    passed={submissionResult.passedCount ?? 0}
                    allFailed={!isAcceptedSub && submissionResult.status !== "WrongAnswer"}
                  />

                  {submissionResult.output && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider font-mono">
                        Program Output / Message
                      </span>
                      <pre className="p-3 rounded-lg border border-border bg-background/80 text-foreground font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {submissionResult.output}
                      </pre>
                    </div>
                  )}

                  {pollTimedOut && (
                    <div className="p-3 rounded-lg border border-pending/30 bg-pending/10 text-pending text-xs">
                      Server took longer than expected. Check the Submissions history page for final results.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}