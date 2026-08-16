import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2, XCircle, Code, ArrowUpRight, FileCode2, AlertTriangle } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Submission } from "@/lib/types";
import { ApiError, fetchQuestions, fetchUserSubmissions } from "@/lib/api";

export default function Submissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [questionTitles, setQuestionTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    async function loadSubmissions() {
      setLoading(true);
      setError(null);
      try {
        const [subs, questions] = await Promise.all([fetchUserSubmissions(), fetchQuestions()]);
        setSubmissions(subs);
        setQuestionTitles(Object.fromEntries(questions.map((q) => [q.id, q.title])));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/auth");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load submissions.");
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between border-b border-neutral-200/80 pb-6 dark:border-neutral-800">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
              Submission <span className="text-circuit">History</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Review your code evaluation history and test case execution logs.
            </p>
          </div>
          <Badge variant="circuit" className="text-xs py-1 px-3 font-mono">
            {submissions.length} Total Submissions
          </Badge>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-fail/20 bg-fail/5 px-4 py-3 text-sm text-fail">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
              <tr>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5">Problem</th>
                <th scope="col" className="px-6 py-3.5">Language</th>
                <th scope="col" className="px-6 py-3.5">Test Results</th>
                <th scope="col" className="px-6 py-3.5 hidden sm:table-cell">Submitted At</th>
                <th scope="col" className="px-6 py-3.5 text-right">View Code</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    <div className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-circuit border-t-transparent" />
                      Loading submissions...
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No submissions found yet. Try solving a problem on the dashboard!
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="group transition-colors hover:bg-circuit/[0.03] dark:hover:bg-neutral-800/40"
                  >
                    <td className="px-6 py-4">
                      {sub.status === "Success" ? (
                        <div className="flex items-center gap-2 text-pass font-semibold text-xs">
                          <CheckCircle2 className="h-4 w-4 text-pass" />
                          Accepted
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-fail font-semibold text-xs">
                          <XCircle className="h-4 w-4 text-fail" />
                          {sub.status === "WrongAnswer" ? "Wrong Answer" : sub.status}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100">
                      <Link
                        to={`/problem/${sub.questionId}`}
                        className="hover:text-circuit transition-colors flex items-center gap-1"
                      >
                        {questionTitles[sub.questionId] || sub.questionId}
                        <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400" />
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {sub.language}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={sub.status === "Success" ? "success" : "destructive"}>
                        {sub.passedCount} / {sub.totalCount} Passed
                      </Badge>
                    </td>

                    <td className="px-6 py-4 hidden sm:table-cell text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSub(sub)}
                        className="h-8 text-xs border-neutral-200 text-neutral-700 hover:bg-circuit/5 hover:text-circuit dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <FileCode2 className="h-3.5 w-3.5 mr-1 text-circuit" />
                        Code
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-[#0c0d12] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-circuit" />
                  <h3 className="font-display font-semibold text-white text-base">
                    Submitted Code: {questionTitles[selectedSub.questionId] || selectedSub.questionId}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono">
                <span>
                  Language: <strong className="text-white">{selectedSub.language}</strong>
                </span>
                <span>
                  Status:{" "}
                  <strong className={selectedSub.status === "Success" ? "text-pass" : "text-fail"}>
                    {selectedSub.status}
                  </strong>
                </span>
              </div>

              <pre className="max-h-96 overflow-auto rounded-xl bg-[#050608] p-4 font-mono text-xs text-neutral-200 border border-neutral-800/80 leading-relaxed">
                {selectedSub.code}
              </pre>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedSub(null)}
                  className="bg-neutral-800 text-white hover:bg-neutral-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}