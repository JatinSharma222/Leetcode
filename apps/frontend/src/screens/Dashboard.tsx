import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, ArrowUpRight, AlertTriangle, Terminal } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import StatsOverview from "@/components/ui/StatsOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TestStrip } from "@/components/ui/TestStrip";
import type { Question, Submission } from "@/lib/types";
import { fetchQuestions, fetchUserSubmissions } from "@/lib/api";

export default function Dashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [questionsData, submissionsData] = await Promise.all([
          fetchQuestions(),
          // Submissions are only used for the "solved" indicator/stats — if
          // the user isn't logged in yet or that call fails, don't block
          // the whole page on it.
          fetchUserSubmissions().catch(() => []),
        ]);
        setQuestions(questionsData);
        setSubmissions(submissionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load problems.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Most recent submission per question — used both for the solved check
  // and to drive each row's TestStrip with a real pass/fail readout.
  const latestByQuestion = new Map<string, Submission>();
  for (const s of submissions) {
    const existing = latestByQuestion.get(s.questionId);
    if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
      latestByQuestion.set(s.questionId, s);
    }
  }
  const solvedQuestionIds = new Set(
    submissions.filter((s) => s.status === "Success").map((s) => s.questionId),
  );

  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const successfulSubmissions = submissions.filter((s) => s.status === "Success").length;
  const acceptanceRate =
    submissions.length > 0 ? Math.round((successfulSubmissions / submissions.length) * 1000) / 10 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-neutral-200/80 pb-7 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-widest text-circuit">
              <Terminal className="h-3.5 w-3.5" />
              ./problems
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
              Pick your next problem
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 max-w-xl">
              Every submission here compiles and runs for real, against real test cases.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-fail/20 bg-fail/5 px-4 py-3 text-sm text-fail">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <StatsOverview
          totalQuestions={questions.length}
          solvedCount={solvedQuestionIds.size}
          totalSubmissions={submissions.length}
          acceptanceRate={acceptanceRate}
        />

        {/* Search Bar */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search problems by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 border-neutral-200 bg-white pl-9 text-sm placeholder:text-neutral-400 focus-visible:border-circuit focus-visible:ring-circuit/20 dark:border-neutral-800 dark:bg-neutral-950"
            />
          </div>
        </div>

        {/* Problem ledger */}
        <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-[11px] font-mono font-medium uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
              <tr>
                <th scope="col" className="px-6 py-3 w-40">Result</th>
                <th scope="col" className="px-6 py-3">Title</th>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell text-right">Tests</th>
                <th scope="col" className="px-6 py-3 hidden md:table-cell text-right">Submissions</th>
                <th scope="col" className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-neutral-500">
                    <div className="inline-flex items-center gap-2 font-mono text-xs">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-circuit border-t-transparent" />
                      loading challenges...
                    </div>
                  </td>
                </tr>
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-neutral-500 text-sm">
                    {questions.length === 0
                      ? "No problems found. Have you run the seed script against your database?"
                      : "No problems match your search."}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => {
                  const isSolved = solvedQuestionIds.has(q.id);
                  const latest = latestByQuestion.get(q.id);

                  return (
                    <tr
                      key={q.id}
                      className="group transition-colors hover:bg-circuit/[0.03] dark:hover:bg-neutral-800/40"
                    >
                      <td className="px-6 py-4 align-middle">
                        {latest ? (
                          <TestStrip
                            total={latest.totalCount || 1}
                            passed={latest.passedCount}
                            allFailed={latest.status !== "Success" && latest.status !== "WrongAnswer"}
                            size="sm"
                            className="max-w-24"
                          />
                        ) : (
                          <span className="font-mono text-[11px] text-neutral-300 dark:text-neutral-700">
                            not attempted
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/problem/${q.id}`}
                          className="font-medium text-neutral-900 group-hover:text-circuit dark:text-neutral-100 transition-colors"
                        >
                          {q.title}
                        </Link>
                      </td>

                      <td className="px-6 py-4 hidden sm:table-cell text-right font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {q._count?.testCases ?? "—"}
                      </td>

                      <td className="px-6 py-4 hidden md:table-cell text-right font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {q._count?.submissions ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link to={`/problem/${q.id}`}>
                          <Button
                            size="sm"
                            className="h-8 rounded-md bg-ink text-xs font-medium text-white transition-all hover:bg-circuit dark:bg-white dark:text-ink dark:hover:bg-circuit dark:hover:text-white"
                          >
                            {isSolved ? "Reopen" : "Solve"}
                            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}