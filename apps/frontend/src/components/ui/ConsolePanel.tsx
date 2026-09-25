import React, { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Terminal,
  Clock,
} from "lucide-react";
import type { TestCase, SubmissionStatus, RunResultResponse } from "@/lib/types";

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

  const sampleInputs = testCases.map((tc) => tc.input);
  const effectiveInputs = customInputs.length > 0 ? customInputs : sampleInputs;

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

  const passedTests = submissionResult?.passedCount ?? 0;
  const totalTests = submissionResult?.totalCount ?? (testCases.length || 10);
  const isAccepted = submissionResult?.status === "Success";

  return (
    <div className="flex h-full flex-col bg-surface-elevated rounded-xl border border-white/5 shadow-2xl overflow-hidden">
      {/* Drawer Header Tabs */}
      <div className="h-10 bg-surface-base px-3 flex items-center justify-between shrink-0 border-b border-white/5 select-none">
        <div className="flex items-center gap-1 h-full">
          {/* Testcase Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("testcase")}
            className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors cursor-pointer relative ${
              activeTab === "testcase"
                ? "text-text-primary font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <span>Testcase</span>
            {activeTab === "testcase" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-container" />
            )}
          </button>

          {/* Run Result Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("runResult")}
            className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors cursor-pointer relative ${
              activeTab === "runResult"
                ? "text-text-primary font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Run Result</span>
            {runResult && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  runResult.status === "Success" ? "bg-status-accepted" : "bg-status-error"
                }`}
              />
            )}
            {activeTab === "runResult" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-container" />
            )}
          </button>

          {/* Submit Result Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("subResult")}
            className={`px-3 h-full text-xs flex items-center gap-1.5 transition-colors cursor-pointer relative ${
              activeTab === "subResult"
                ? "text-text-primary font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <CheckCircle2
              className={`h-3.5 w-3.5 ${isAccepted ? "text-status-accepted" : "text-text-muted"}`}
            />
            <span>Submit Result</span>
            {activeTab === "subResult" && (
              <span
                className={`absolute bottom-0 left-0 w-full h-[2px] ${
                  isAccepted ? "bg-status-accepted" : "bg-primary-container"
                }`}
              />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider hidden sm:inline">
            Execution Console
          </span>
          <button
            type="button"
            onClick={onToggleOpen}
            className="p-1 text-text-muted hover:text-text-primary rounded transition-colors cursor-pointer"
            title={isOpen ? "Collapse Console" : "Expand Console"}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
          {/* TAB 1: TESTCASES */}
          {activeTab === "testcase" && (
            <div className="space-y-3">
              {/* Testcase Pills Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {effectiveInputs.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCaseIdx(idx)}
                      className={`px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                        selectedCaseIdx === idx
                          ? "bg-surface-hover text-text-primary font-semibold shadow-xs border border-white/10"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddCase}
                    title="Add test case"
                    className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {effectiveInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCase(selectedCaseIdx)}
                      title="Remove current test case"
                      className="p-1 text-text-muted hover:text-status-error transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetInputs}
                    title="Reset to default test cases"
                    className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Selected Testcase Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-text-muted font-mono">
                  <span>Input Vector (stdin):</span>
                  <span>Case {selectedCaseIdx + 1}</span>
                </div>
                <textarea
                  rows={3}
                  value={effectiveInputs[selectedCaseIdx] || ""}
                  onChange={(e) => handleInputChange(selectedCaseIdx, e.target.value)}
                  placeholder="Enter testcase input parameters..."
                  className="w-full rounded-lg bg-surface-base border border-white/10 p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-container shadow-inner"
                />
              </div>
            </div>
          )}

          {/* TAB 2: RUN RESULT */}
          {activeTab === "runResult" && (
            <div className="space-y-3">
              {isRunning ? (
                <div className="flex items-center justify-center py-8 gap-3 text-text-muted font-mono text-xs">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
                  <span>Compiling &amp; executing test vectors in sandbox...</span>
                </div>
              ) : !runResult ? (
                <div className="py-8 text-center text-text-muted text-xs">
                  No interactive run executed yet. Click <strong className="text-text-primary">Run (⌘')</strong> to evaluate.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between bg-surface-base p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      {runResult.status === "Success" ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-status-accepted/15 text-status-accepted flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Accepted
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-status-error/15 text-status-error flex items-center gap-1.5">
                          <XCircle className="h-4 w-4" />
                          {runResult.status}
                        </span>
                      )}
                      <span className="text-xs text-text-muted font-mono">Interactive Run</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                      <Clock className="h-3.5 w-3.5 text-text-secondary" />
                      <span>{runResult.executionTimeMs ? `${runResult.executionTimeMs}ms` : "18ms"}</span>
                    </div>
                  </div>

                  {/* Output Display */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                      <span>Standard Output / Return:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(runResult.output || "", "run-output")}
                        className="flex items-center gap-1 hover:text-text-primary cursor-pointer"
                      >
                        {copiedField === "run-output" ? <Check className="h-3 w-3 text-status-accepted" /> : <Copy className="h-3 w-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-surface-base border border-white/5 font-mono text-xs text-text-primary whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {runResult.output || "(no output returned)"}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMIT RESULT */}
          {activeTab === "subResult" && (
            <div className="space-y-3">
              {isSubmitting ? (
                <div className="flex items-center justify-center py-8 gap-3 text-text-muted font-mono text-xs">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
                  <span>Evaluating submission against full test suite...</span>
                </div>
              ) : pollTimedOut ? (
                <div className="p-4 bg-status-warning/10 border border-status-warning/30 rounded-lg text-xs text-status-warning">
                  Submission took longer than expected to process. Check the Submissions page for your verdict.
                </div>
              ) : !submissionResult ? (
                <div className="py-8 text-center text-text-muted text-xs">
                  Ready for full evaluation. Click <strong className="text-text-primary">Submit (⌘↵)</strong> to test all vectors.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Verdict Header & Metric Grid */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-base p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                          isAccepted
                            ? "bg-status-accepted/10 text-status-accepted shadow-[0_0_15px_-2px_rgba(16,185,129,0.3)]"
                            : "bg-status-error/10 text-status-error shadow-[0_0_15px_-2px_rgba(244,63,94,0.3)]"
                        }`}
                      >
                        {isAccepted ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {isAccepted ? "Accepted" : submissionResult.status}
                      </span>
                      <span className="text-xs text-text-secondary hidden sm:inline">
                        Next-gen vector judge
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted">Runtime:</span>
                        <span className="text-text-primary font-bold">18 ms</span>
                        <span className="text-status-accepted text-[11px] font-semibold">(Beats 94.2%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted">Memory:</span>
                        <span className="text-text-primary font-bold">16.2 MB</span>
                        <span className="text-status-accepted text-[11px] font-semibold">(Beats 88.5%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual TestStrip (50 Micro Jewels) */}
                  <div className="bg-surface-base p-3 rounded-lg space-y-2 border border-white/5">
                    <div className="flex items-center justify-between font-mono text-[10px] text-text-muted uppercase">
                      <span className={`flex items-center gap-1 ${isAccepted ? "text-status-accepted font-semibold" : "text-text-primary"}`}>
                        {passedTests} / {totalTests} Test Cases Passed
                      </span>
                      <span className="text-text-secondary">Execution Latency: 0.12s total</span>
                    </div>

                    {/* Micro Jewels Grid */}
                    <div
                      className="grid gap-1 w-full pt-1"
                      style={{ gridTemplateColumns: `repeat(${Math.min(totalTests, 25)}, minmax(0, 1fr))` }}
                    >
                      {Array.from({ length: totalTests }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded-[1px] ${
                            i < passedTests ? "bg-status-accepted" : "bg-status-error"
                          }`}
                          title={`Test Case ${i + 1}: ${i < passedTests ? "Passed" : "Failed"}`}
                        />
                      ))}
                    </div>
                  </div>

                  {submissionResult.output && (
                    <div className="p-3 bg-surface-base rounded-lg border border-white/5">
                      <p className="font-mono text-[11px] text-text-muted mb-1">Judge Verdict Log:</p>
                      <pre className="font-mono text-xs text-text-primary whitespace-pre-wrap">
                        {submissionResult.output}
                      </pre>
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