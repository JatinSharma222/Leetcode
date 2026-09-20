import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  ArrowUpRight,
  AlertTriangle,
  Terminal,
  CheckCircle2,
  Circle,
  Shuffle,
  Tag,
  Filter,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import StatsOverview from "@/components/ui/StatsOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Question, Submission } from "@/lib/types";
import { fetchQuestions, fetchUserSubmissions } from "@/lib/api";

const DIFFICULTY_MAP: Record<string, { label: "Easy" | "Medium" | "Hard"; color: string; bg: string }> = {
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Solved" | "Unsolved">("All");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [questionsData, submissionsData] = await Promise.all([
          fetchQuestions(),
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

  const solvedQuestionIds = useMemo(
    () => new Set(submissions.filter((s) => s.status === "Success").map((s) => s.questionId)),
    [submissions],
  );

  // Breakdown counts
  const easyQuestions = questions.filter((q) => (DIFFICULTY_MAP[q.id]?.label || "Easy") === "Easy");
  const mediumQuestions = questions.filter((q) => DIFFICULTY_MAP[q.id]?.label === "Medium");
  const hardQuestions = questions.filter((q) => DIFFICULTY_MAP[q.id]?.label === "Hard");

  const easySolved = easyQuestions.filter((q) => solvedQuestionIds.has(q.id)).length;
  const mediumSolved = mediumQuestions.filter((q) => solvedQuestionIds.has(q.id)).length;
  const hardSolved = hardQuestions.filter((q) => solvedQuestionIds.has(q.id)).length;

  const acceptanceRate = useMemo(() => {
    if (submissions.length === 0) return 0;
    const successful = submissions.filter((s) => s.status === "Success").length;
    return Math.round((successful / submissions.length) * 1000) / 10;
  }, [submissions]);

  // Filtered problems list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search filter
      const matchSearch =
        q.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchSearch) return false;

      // Difficulty filter
      const qDiff = DIFFICULTY_MAP[q.id]?.label || "Easy";
      if (difficultyFilter !== "All" && qDiff !== difficultyFilter) return false;

      // Status filter
      const isSolved = solvedQuestionIds.has(q.id);
      if (statusFilter === "Solved" && !isSolved) return false;
      if (statusFilter === "Unsolved" && isSolved) return false;

      return true;
    });
  }, [questions, searchQuery, difficultyFilter, statusFilter, solvedQuestionIds]);

  const handlePickRandom = () => {
    if (questions.length === 0) return;
    const unsolved = questions.filter((q) => !solvedQuestionIds.has(q.id));
    const pool = unsolved.length > 0 ? unsolved : questions;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    if (randomQ) {
      navigate(`/problem/${randomQ.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Terminal className="h-3.5 w-3.5" />
              Practice Arena
            </div>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Problem Solving Workspace
            </h1>
            <p className="mt-1 text-sm text-neutral-400 max-w-xl leading-relaxed">
              Solve problems with instant interactive testing in secure Docker execution environments.
            </p>
          </div>

          <Button
            onClick={handlePickRandom}
            className="flex items-center gap-2 h-9 bg-primary text-black font-semibold text-xs shadow-sm hover:bg-primary/90 active:scale-[0.98]"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Pick Random
          </Button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-fail/20 bg-fail/5 px-4 py-3 text-sm text-fail">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <StatsOverview
          totalQuestions={questions.length}
          solvedCount={solvedQuestionIds.size}
          totalSubmissions={submissions.length}
          acceptanceRate={acceptanceRate}
          easySolved={easySolved}
          easyTotal={easyQuestions.length}
          mediumSolved={mediumSolved}
          mediumTotal={mediumQuestions.length}
          hardSolved={hardSolved}
          hardTotal={hardQuestions.length}
        />

        {/* Filter & Search Bar */}
        <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs border-border bg-[#18181c] placeholder:text-neutral-500 rounded-lg focus-visible:border-primary focus-visible:ring-primary/20"
            />
          </div>

          {/* Difficulty and Status Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg border border-border bg-[#18181c] p-1 text-xs">
              {(["All", "Easy", "Medium"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    difficultyFilter === diff
                      ? "bg-neutral-800 text-white font-semibold shadow-xs"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-lg border border-border bg-[#18181c] p-1 text-xs">
              {(["All", "Solved", "Unsolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? "bg-neutral-800 text-white font-semibold shadow-xs"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Problems Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-[#18181c] shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-[#141417] text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
              <tr>
                <th scope="col" className="px-5 py-3 w-16 text-center">Status</th>
                <th scope="col" className="px-5 py-3">Title</th>
                <th scope="col" className="px-5 py-3 w-32">Difficulty</th>
                <th scope="col" className="px-5 py-3 hidden md:table-cell w-40">Topics</th>
                <th scope="col" className="px-5 py-3 hidden sm:table-cell text-right w-24">Tests</th>
                <th scope="col" className="px-5 py-3 text-right w-28">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-neutral-500">
                    <div className="inline-flex items-center gap-2 font-mono text-xs">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading challenges...
                    </div>
                  </td>
                </tr>
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-neutral-500 text-xs font-sans">
                    {questions.length === 0
                      ? "No problems found in the database. Run seed script if necessary."
                      : "No problems match your current search and filter criteria."}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isSolved = solvedQuestionIds.has(q.id);
                  const diffObj = DIFFICULTY_MAP[q.id] || {
                    label: "Easy",
                    color: "text-[#00b8a3]",
                    bg: "bg-[#00b8a3]/10 border-[#00b8a3]/20",
                  };
                  const topicsList = TOPICS_MAP[q.id] || ["Algorithms"];

                  return (
                    <tr
                      key={q.id}
                      className="group transition-colors hover:bg-neutral-800/40"
                    >
                      {/* Solved Status Icon */}
                      <td className="px-5 py-3.5 text-center align-middle">
                        {isSolved ? (
                          <CheckCircle2 className="h-4 w-4 text-pass inline" />
                        ) : (
                          <span className="text-neutral-600 text-xs font-mono">—</span>
                        )}
                      </td>

                      {/* Problem Title & Number */}
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/problem/${q.id}`}
                          className="font-medium text-white group-hover:text-primary transition-colors flex items-center gap-2"
                        >
                          <span className="font-mono text-neutral-500 text-xs">
                            {idx + 1}.
                          </span>
                          <span>{q.title}</span>
                        </Link>
                      </td>

                      {/* Difficulty Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${diffObj.bg} ${diffObj.color}`}
                        >
                          {diffObj.label}
                        </span>
                      </td>

                      {/* Topics */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {topicsList.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Tests count */}
                      <td className="px-5 py-3.5 hidden sm:table-cell text-right font-mono text-xs text-neutral-400">
                        {q._count?.testCases ?? "—"}
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/problem/${q.id}`}>
                          <Button
                            size="sm"
                            className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${
                              isSolved
                                ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white"
                                : "bg-primary text-black hover:bg-primary/90 shadow-sm"
                            }`}
                          >
                            {isSolved ? "Review" : "Solve"}
                            <ArrowUpRight className="ml-1 h-3 w-3" />
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