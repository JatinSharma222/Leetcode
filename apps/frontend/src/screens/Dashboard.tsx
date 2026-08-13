import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, CheckCircle, Circle, ArrowUpRight, Sparkles, AlertTriangle } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import StatsOverview from "@/components/ui/StatsOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen bg-neutral-50 font-sans dark:bg-neutral-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Banner Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200/80 pb-6 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:border-orange-500/30 dark:text-orange-400">
              <Sparkles className="h-3.5 w-3.5" />
              Practice Environment
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
              Problem <span className="text-orange-500">Workspace</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-xl">
              Sharpen your algorithmic thinking and data structure skills with curated challenges.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Stats Summary Banner — computed from real submissions, not hardcoded */}
        <StatsOverview
          totalQuestions={questions.length}
          solvedCount={solvedQuestionIds.size}
          totalSubmissions={submissions.length}
          acceptanceRate={acceptanceRate}
        />

        {/* Search Bar */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search problems by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 border-neutral-200 bg-neutral-50/50 pl-9 text-sm placeholder:text-neutral-400 focus-visible:border-orange-500 focus-visible:ring-orange-200 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-orange-950"
            />
          </div>
        </div>

        {/* Questions Table List */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
              <tr>
                <th scope="col" className="px-6 py-3.5 w-12 text-center">Status</th>
                <th scope="col" className="px-6 py-3.5">Title</th>
                <th scope="col" className="px-6 py-3.5 hidden sm:table-cell">Test Cases</th>
                <th scope="col" className="px-6 py-3.5 hidden md:table-cell">Submissions</th>
                <th scope="col" className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <div className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                      Loading challenges...
                    </div>
                  </td>
                </tr>
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    {questions.length === 0
                      ? "No problems found. Have you run the seed script against your database?"
                      : "No problems match your search."}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => {
                  const isSolved = solvedQuestionIds.has(q.id);
                  return (
                    <tr
                      key={q.id}
                      className="group transition-colors hover:bg-orange-500/5 dark:hover:bg-neutral-800/50"
                    >
                      <td className="px-6 py-4 text-center">
                        {isSolved ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <Circle className="h-4 w-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/problem/${q.id}`}
                          className="font-semibold text-neutral-900 group-hover:text-orange-600 dark:text-neutral-100 dark:group-hover:text-orange-400 transition-colors"
                        >
                          {q.title}
                        </Link>
                      </td>

                      <td className="px-6 py-4 hidden sm:table-cell text-neutral-500 dark:text-neutral-400 text-xs">
                        {q._count?.testCases ?? "—"}
                      </td>

                      <td className="px-6 py-4 hidden md:table-cell text-neutral-500 dark:text-neutral-400 text-xs">
                        {q._count?.submissions ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link to={`/problem/${q.id}`}>
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-neutral-900 text-xs font-medium text-white transition-all hover:bg-orange-600 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-orange-500 dark:hover:text-white"
                          >
                            Solve
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