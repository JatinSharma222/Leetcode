import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, CheckCircle, XCircle, Terminal, Loader2 } from "lucide-react";
import type { TestCase, SubmissionStatus } from "@/lib/types";
import { Badge } from "./badge";
import { TestStrip } from "./TestStrip";

interface SubmissionResultView {
  status: SubmissionStatus;
  output?: string | null;
  passedCount?: number;
  totalCount?: number;
}

interface ConsolePanelProps {
  testCases?: TestCase[];
  isSubmitting?: boolean;
  submissionResult?: SubmissionResultView | null;
  /** True if we gave up polling before the worker finished. */
  pollTimedOut?: boolean;
}

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  Processing: "Processing",
  Success: "Accepted",
  WrongAnswer: "Wrong Answer",
  Failure: "Failure",
  TLE: "Time Limit Exceeded",
};

export default function ConsolePanel({
  testCases = [],
  isSubmitting = false,
  submissionResult = null,
  pollTimedOut = false,
}: ConsolePanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"testcases" | "result">("testcases");
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

  // Jump to the result tab automatically once a submission is in flight.
  useEffect(() => {
    if (isSubmitting || submissionResult) {
      setActiveTab("result");
    }
  }, [isSubmitting, submissionResult]);

  const currentTestCase = testCases[selectedCaseIndex] || testCases[0];
  const isAccepted = submissionResult?.status === "Success";

  return (
    <div className="flex flex-col border-t border-neutral-800 bg-[#0e1017] text-neutral-200 font-sans">
      {/* Header bar */}
      <div className="flex h-10 items-center justify-between px-4 border-b border-neutral-800 bg-[#141722]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            {isOpen ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronUp className="h-4 w-4 text-neutral-400" />}
            <Terminal className="h-3.5 w-3.5 text-circuit" />
            Console & Test Results
          </button>

          {isOpen && (
            <div className="flex items-center gap-1 ml-4 border-l border-neutral-800 pl-3">
              <button
                onClick={() => setActiveTab("testcases")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === "testcases" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Sample Tests
              </button>

              <button
                onClick={() => setActiveTab("result")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === "result" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Submission Result
                {submissionResult && (
                  <span className={`h-2 w-2 rounded-full ${isAccepted ? "bg-pass" : "bg-fail"}`} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Console Content Body */}
      {isOpen && (
        <div className="p-4 max-h-56 overflow-auto font-mono text-xs leading-relaxed">
          {activeTab === "testcases" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {testCases.map((tc, idx) => (
                  <button
                    key={tc.id || idx}
                    onClick={() => setSelectedCaseIndex(idx)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      selectedCaseIndex === idx
                        ? "bg-circuit/15 text-circuit border border-circuit/30"
                        : "bg-neutral-800/80 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              {currentTestCase ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-sans font-medium text-neutral-400 uppercase tracking-wider">
                      Input (stdin)
                    </p>
                    <pre className="p-3 rounded-lg bg-[#08090d] border border-neutral-800 text-neutral-200 overflow-x-auto">
                      {currentTestCase.input}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-sans font-medium text-neutral-400 uppercase tracking-wider">
                      Expected Output
                    </p>
                    <pre className="p-3 rounded-lg bg-[#08090d] border border-neutral-800 text-pass overflow-x-auto">
                      {currentTestCase.expectedOutput}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-500 font-sans">No sample test cases for this problem.</p>
              )}
            </div>
          ) : (
            /* Submission Result Tab */
            <div>
              {!submissionResult && !isSubmitting && !pollTimedOut ? (
                <div className="py-6 text-center text-neutral-500 font-sans">
                  Click <span className="font-semibold text-neutral-300">Submit</span> to evaluate your solution against all test cases.
                </div>
              ) : isSubmitting ? (
                <div className="py-6 flex items-center justify-center gap-2 text-neutral-400 font-sans">
                  <Loader2 className="h-4 w-4 animate-spin text-circuit" />
                  Compiling and running your code against the test cases...
                </div>
              ) : submissionResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {isAccepted ? (
                        <div className="flex items-center gap-2 text-pass font-sans font-semibold text-base">
                          <CheckCircle className="h-5 w-5" />
                          Accepted
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-fail font-sans font-semibold text-base">
                          <XCircle className="h-5 w-5" />
                          {STATUS_LABEL[submissionResult.status]}
                        </div>
                      )}

                      <Badge variant={isAccepted ? "success" : "destructive"}>
                        {submissionResult.passedCount ?? 0} / {submissionResult.totalCount ?? testCases.length} Test cases passed
                      </Badge>
                    </div>
                  </div>

                  <TestStrip
                    total={submissionResult.totalCount ?? testCases.length}
                    passed={submissionResult.passedCount ?? 0}
                    allFailed={!isAccepted && submissionResult.status !== "WrongAnswer"}
                  />

                  {submissionResult.output != null && submissionResult.output !== "" && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-sans font-medium text-neutral-400 uppercase tracking-wider">
                        Last Program Output
                      </p>
                      <pre className="p-3 rounded-lg bg-[#08090d] border border-neutral-800 text-neutral-200 overflow-x-auto">
                        {submissionResult.output}
                      </pre>
                    </div>
                  )}
                </div>
              ) : pollTimedOut ? (
                <div className="py-6 text-center text-pending font-sans">
                  Still processing on the server — check the Submissions page shortly for the result.
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}