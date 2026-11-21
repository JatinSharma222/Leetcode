import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Plus,
  RotateCcw,
  Terminal,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  RunResultResponse,
  SubmissionCaseResult,
  SubmissionStatus,
  TestCase,
} from "@/lib/types";
import { getStatusMeta } from "@/lib/ui";

export interface SubmissionResultView {
  status: SubmissionStatus;
  output?: string | null;
  passedCount?: number;
  totalCount?: number;
  cases?: SubmissionCaseResult[];
}

export interface LiveEvaluationProgress {
  phase: "compiling" | "testcase" | "completed";
  current?: number;
  total?: number;
  passed?: boolean;
}

interface ConsolePanelProps {
  testCases?: TestCase[];
  isRunning?: boolean;
  runResult?: RunResultResponse | null;
  isSubmitting?: boolean;
  liveProgress?: LiveEvaluationProgress | null;
  submissionResult?: SubmissionResultView | null;
  pollTimedOut?: boolean;
  customInputs?: string[];
  onCustomInputsChange?: (inputs: string[]) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const MAX_CUSTOM_CASES = 10;

function VerdictBadge({ status }: { status: SubmissionStatus | string }) {
  const meta = getStatusMeta(status);
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export default function ConsolePanel({
  testCases = [],
  isRunning = false,
  runResult = null,
  isSubmitting = false,
  liveProgress = null,
  submissionResult = null,
  pollTimedOut = false,
  customInputs = [],
  onCustomInputsChange,
  isOpen,
  onToggleOpen,
}: ConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<"testcase" | "runResult" | "subResult">("testcase");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [selectedRunCaseIdx, setSelectedRunCaseIdx] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isRunning || runResult) setActiveTab("runResult");
  }, [isRunning, runResult]);

  useEffect(() => {
    if (isSubmitting || submissionResult) setActiveTab("subResult");
  }, [isSubmitting, submissionResult]);

  useEffect(() => {
    if (runResult?.cases && runResult.cases.length > 0) {
      const firstFailIdx = runResult.cases.findIndex((item) => !item.passed);
      setSelectedRunCaseIdx(firstFailIdx >= 0 ? firstFailIdx : 0);
    } else {
      setSelectedRunCaseIdx(0);
    }
  }, [runResult]);

  const sampleInputs = testCases.map((testCase) => testCase.input);
  const effectiveInputs = customInputs.length > 0 ? customInputs : sampleInputs;

  const handleInputChange = (index: number, value: string) => {
    const updated = [...(customInputs.length > 0 ? customInputs : sampleInputs)];
    updated[index] = value;
    onCustomInputsChange?.(updated);
  };

  const handleAddCase = () => {
    if (effectiveInputs.length >= MAX_CUSTOM_CASES) return;
    const base = customInputs.length > 0 ? customInputs : sampleInputs;
    const updated = [...base, ""];
    onCustomInputsChange?.(updated);
    setSelectedCaseIdx(updated.length - 1);
  };

  const handleRemoveCase = (index: number) => {
    const base = customInputs.length > 0 ? customInputs : sampleInputs;
    if (base.length <= 1) return;
    const updated = base.filter((_, itemIndex) => itemIndex !== index);
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

  const isRunAccepted = runResult?.status === "Accepted" || runResult?.status === "Success";
  const runPassedCount =
    runResult?.cases?.filter((item) => item.passed).length ??
    (isRunAccepted ? (runResult?.cases?.length ?? 0) : 0);
  const runTotalCount = runResult?.cases?.length ?? 0;

  const isAccepted =
    submissionResult?.status === "Success" || submissionResult?.status === "Accepted";
  const passedTests = submissionResult?.passedCount ?? 0;
  const totalTests = submissionResult?.totalCount ?? 0;
  const caseResults = submissionResult?.cases ?? [];
  const progressPercent =
    liveProgress?.phase === "testcase" && liveProgress.total
      ? Math.min(100, Math.round(((liveProgress.current ?? 0) / liveProgress.total) * 100))
      : 0;

  const tabs = [
    { id: "testcase" as const, label: "Test cases" },
    { id: "runResult" as const, label: "Run result" },
    { id: "subResult" as const, label: "Submit result" },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border-hairline bg-surface-elevated">
      <div className="flex h-10 shrink-0 select-none items-center justify-between border-b border-border-hairline bg-surface-base px-2">
        <div role="tablist" aria-label="Console panels" className="flex h-full items-center gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex h-full items-center gap-1.5 px-3 text-xs transition-colors ${
                activeTab === tab.id
                  ? "font-medium text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.id === "runResult" ? <Terminal className="h-3.5 w-3.5" /> : null}
              {tab.id === "subResult" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              {tab.label}
              {tab.id === "runResult" && runResult ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isRunAccepted ? "bg-status-accepted" : "bg-status-error"
                  }`}
                />
              ) : null}
              {tab.id === "subResult" && submissionResult ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isAccepted ? "bg-status-accepted" : "bg-status-error"
                  }`}
                />
              ) : null}
              {activeTab === tab.id ? (
                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-primary-container" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[10px] uppercase tracking-wide text-text-muted sm:inline">
            Console
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleOpen}
            aria-label={isOpen ? "Collapse console" : "Expand console"}
            aria-expanded={isOpen}
          >
            {isOpen ? <ChevronDown /> : <ChevronUp />}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="flex-1 space-y-3 overflow-y-auto p-4 font-sans">
          {activeTab === "testcase" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-border-hairline pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {effectiveInputs.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedCaseIdx(index)}
                      aria-pressed={selectedCaseIdx === index}
                      className={`shrink-0 rounded-md px-3 py-1 font-mono text-xs transition-colors ${
                        selectedCaseIdx === index
                          ? "border border-border-subtle bg-surface-hover text-text-primary"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      Case {index + 1}
                    </button>
                  ))}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddCase}
                    disabled={effectiveInputs.length >= MAX_CUSTOM_CASES}
                    aria-label="Add test case"
                    title={
                      effectiveInputs.length >= MAX_CUSTOM_CASES
                        ? `Maximum of ${MAX_CUSTOM_CASES} cases`
                        : "Add test case"
                    }
                  >
                    <Plus />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <span className="mr-1 font-mono text-[10px] text-text-muted">
                    {effectiveInputs.length}/{MAX_CUSTOM_CASES}
                  </span>
                  {effectiveInputs.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCase(selectedCaseIdx)}
                      aria-label="Remove current test case"
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetInputs}
                    aria-label="Reset to sample test cases"
                  >
                    <RotateCcw />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-xs text-text-muted">
                  <label htmlFor="custom-testcase-input">Input (stdin)</label>
                  <span>Case {selectedCaseIdx + 1}</span>
                </div>
                <textarea
                  id="custom-testcase-input"
                  rows={4}
                  value={effectiveInputs[selectedCaseIdx] ?? ""}
                  onChange={(event) => handleInputChange(selectedCaseIdx, event.target.value)}
                  placeholder="Enter test case input"
                  className="w-full rounded-md border border-border-hairline bg-surface-base p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-primary/70 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                {effectiveInputs.length >= MAX_CUSTOM_CASES ? (
                  <p className="text-[11px] text-text-muted">
                    Custom test cases are limited to {MAX_CUSTOM_CASES} per run.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeTab === "runResult" ? (
            <div className="space-y-3">
              {isRunning ? (
                <div className="flex items-center justify-center gap-3 py-8 font-mono text-xs text-text-muted">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
                  <span>Running test cases…</span>
                </div>
              ) : !runResult ? (
                <p className="py-8 text-center text-xs text-text-muted">
                  Run your code to test it against the sample cases.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-hairline bg-surface-base p-3">
                    <div className="flex items-center gap-2">
                      <VerdictBadge status={runResult.status} />
                      <span className="font-mono text-xs text-text-muted">
                        {runTotalCount > 0
                          ? `${runPassedCount} / ${runTotalCount} cases passed`
                          : "Run complete"}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {runResult.durationMs ?? runResult.executionTimeMs ?? 0}ms
                    </span>
                  </div>

                  {runResult.cases && runResult.cases.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-hairline pb-2">
                        {runResult.cases.map((item, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedRunCaseIdx(index)}
                            aria-pressed={selectedRunCaseIdx === index}
                            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs transition-colors ${
                              selectedRunCaseIdx === index
                                ? "border border-border-subtle bg-surface-hover text-text-primary"
                                : "text-text-muted hover:text-text-primary"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.passed ? "bg-status-accepted" : "bg-status-error"
                              }`}
                            />
                            Case {index + 1}
                          </button>
                        ))}
                      </div>

                      {(() => {
                        const activeCase =
                          runResult.cases[selectedRunCaseIdx] ?? runResult.cases[0];
                        if (!activeCase) return null;

                        return (
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between font-mono text-xs text-text-muted">
                                <span>Input</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(activeCase.input || "", `run-input-${selectedRunCaseIdx}`)
                                  }
                                  className="flex items-center gap-1 hover:text-text-primary"
                                >
                                  {copiedField === `run-input-${selectedRunCaseIdx}` ? (
                                    <Check className="h-3 w-3 text-status-accepted" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                  Copy
                                </button>
                              </div>
                              <pre className="whitespace-pre-wrap rounded-md border border-border-hairline bg-surface-base p-3 font-mono text-xs text-text-primary">
                                {activeCase.input || "(empty)"}
                              </pre>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between font-mono text-xs text-text-muted">
                                <span className="flex items-center gap-1.5">
                                  Output
                                  {activeCase.passed ? (
                                    <span className="text-[10px] font-semibold text-status-accepted">
                                      Matches expected
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-status-error">
                                      Does not match
                                    </span>
                                  )}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      activeCase.actualOutput || "",
                                      `run-output-${selectedRunCaseIdx}`,
                                    )
                                  }
                                  className="flex items-center gap-1 hover:text-text-primary"
                                >
                                  {copiedField === `run-output-${selectedRunCaseIdx}` ? (
                                    <Check className="h-3 w-3 text-status-accepted" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                  Copy
                                </button>
                              </div>
                              <pre
                                className={`max-h-36 overflow-y-auto whitespace-pre-wrap rounded-md border p-3 font-mono text-xs ${
                                  activeCase.passed
                                    ? "border-border-hairline bg-surface-base text-text-primary"
                                    : "border-status-error/30 bg-status-error/5 text-status-error"
                                }`}
                              >
                                {activeCase.actualOutput || "(no output)"}
                              </pre>
                            </div>

                            {activeCase.expectedOutput ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between font-mono text-xs text-text-muted">
                                  <span>Expected output</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(
                                        activeCase.expectedOutput || "",
                                        `run-expected-${selectedRunCaseIdx}`,
                                      )
                                    }
                                    className="flex items-center gap-1 hover:text-text-primary"
                                  >
                                    {copiedField === `run-expected-${selectedRunCaseIdx}` ? (
                                      <Check className="h-3 w-3 text-status-accepted" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                    Copy
                                  </button>
                                </div>
                                <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-md border border-border-hairline bg-surface-base p-3 font-mono text-xs text-text-primary">
                                  {activeCase.expectedOutput}
                                </pre>
                              </div>
                            ) : null}

                            {activeCase.error ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 font-mono text-xs text-status-error">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Error
                                </div>
                                <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-md border border-status-error/20 bg-status-error/10 p-3 font-mono text-xs text-status-error">
                                  {activeCase.error}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {runResult.error ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-status-error">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Error
                          </div>
                          <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-md border border-status-error/20 bg-status-error/10 p-3 font-mono text-xs text-status-error">
                            {runResult.error}
                          </pre>
                        </div>
                      ) : null}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-xs text-text-muted">
                          <span>Output</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(runResult.output || "", "run-output")}
                            className="flex items-center gap-1 hover:text-text-primary"
                          >
                            {copiedField === "run-output" ? (
                              <Check className="h-3 w-3 text-status-accepted" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy
                          </button>
                        </div>
                        <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-md border border-border-hairline bg-surface-base p-3 font-mono text-xs text-text-primary">
                          {runResult.output || "(no output)"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "subResult" ? (
            <div className="space-y-3">
              {isSubmitting ? (
                <div className="flex flex-col items-center justify-center gap-3 py-6 font-mono text-xs text-text-muted">
                  <div className="flex items-center gap-2.5">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
                    <span>
                      {liveProgress?.phase === "compiling"
                        ? "Compiling…"
                        : liveProgress?.phase === "testcase"
                          ? `Running test case ${liveProgress.current} of ${liveProgress.total}…`
                          : "Running the full test suite…"}
                    </span>
                  </div>
                  {liveProgress?.phase === "testcase" && liveProgress.total ? (
                    <div className="mt-1 h-1.5 w-56 overflow-hidden rounded-full border border-border-hairline bg-surface-base">
                      <div
                        className="h-full bg-primary-container transition-all duration-200"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              ) : pollTimedOut ? (
                <div className="rounded-md border border-status-warning/30 bg-status-warning/10 p-4 text-xs text-status-warning">
                  This submission is taking longer than expected. Check the Submissions page for the
                  final verdict.
                </div>
              ) : !submissionResult ? (
                <p className="py-8 text-center text-xs text-text-muted">
                  Submit your solution to run it against the full test suite.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-hairline bg-surface-base p-3">
                    <div className="flex items-center gap-2">
                      <VerdictBadge status={submissionResult.status} />
                      <span className="font-mono text-xs text-text-muted">
                        {totalTests > 0
                          ? `${passedTests} / ${totalTests} test cases passed`
                          : "Submission complete"}
                      </span>
                    </div>
                    {totalTests > 0 ? (
                      <span className="font-mono text-xs text-text-muted">
                        {Math.round((passedTests / Math.max(totalTests, 1)) * 100)}%
                      </span>
                    ) : null}
                  </div>

                  {totalTests > 0 ? (
                    <div className="space-y-2 rounded-md border border-border-hairline bg-surface-base p-3">
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-text-muted">
                        <span>Test cases</span>
                        <span>Passed {passedTests} of {totalTests}</span>
                      </div>

                      {caseResults.length > 0 ? (
                        <div
                          className="grid gap-1 pt-1"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(caseResults.length, 30)}, minmax(0, 1fr))`,
                          }}
                        >
                          {caseResults.map((result, index) => (
                            <div
                              key={index}
                              className={`h-2 rounded-[2px] ${
                                result.passed
                                  ? "bg-status-accepted"
                                  : result.timedOut
                                    ? "bg-status-warning"
                                    : "bg-status-error"
                              }`}
                              title={`Test case ${index + 1}: ${
                                result.passed
                                  ? "Passed"
                                  : result.timedOut
                                    ? "Timed out"
                                    : "Failed"
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                          <div
                            className={`h-full rounded-full ${
                              isAccepted ? "bg-status-accepted" : "bg-status-warning"
                            }`}
                            style={{
                              width: `${Math.round((passedTests / Math.max(totalTests, 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}

                  {submissionResult.output ? (
                    <div className="space-y-1.5 rounded-md border border-border-hairline bg-surface-base p-3">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
                        Output
                      </p>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-text-primary">
                        {submissionResult.output}
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
