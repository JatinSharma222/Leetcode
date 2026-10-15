import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Download,
  Terminal,
  Search,
  Copy,
  Check,
  AlertTriangle,
  GitFork,
  FileCode2,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import Navbar from "@/components/ui/Navbar";
import type { Submission } from "@/lib/types";
import { ApiError, fetchQuestions, fetchUserSubmissions } from "@/lib/api";
import { getProblemMetadata } from "@/lib/problemMeta";

export default function Submissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [questionTitles, setQuestionTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [copied, setCopied] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "WrongAnswer" | "TLE">("All");
  const [languageFilter, setLanguageFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
      setLoading(true);
      setError(null);
      try {
        const [subs, questions] = await Promise.all([fetchUserSubmissions(), fetchQuestions()]);
        setSubmissions(subs);
        setQuestionTitles(Object.fromEntries(questions.map((q) => [q.id, q.title])));
        if (subs.length > 0) {
          setSelectedSub(subs[0] ?? null);
        }
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

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== "All" && sub.status !== statusFilter) return false;
      if (languageFilter !== "All" && sub.language.toLowerCase() !== languageFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const qTitle = (questionTitles[sub.questionId] || sub.questionId).toLowerCase();
        if (!qTitle.includes(searchQuery.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [submissions, statusFilter, languageFilter, searchQuery, questionTitles]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = "id,questionId,status,language,passedCount,totalCount,createdAt\n";
    const rows = submissions
      .map((s) => `${s.id},${s.questionId},${s.status},${s.language},${s.passedCount},${s.totalCount},${s.createdAt}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ateliercode_submissions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const acceptedCount = submissions.filter((s) => s.status === "Success").length;
  const acceptanceRate = submissions.length > 0 ? Math.round((acceptedCount / submissions.length) * 1000) / 10 : 0;

  const recentCount = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return submissions.filter((s) => new Date(s.createdAt).getTime() >= oneWeekAgo).length;
  }, [submissions]);

  const solvedProblemIds = useMemo(() => {
    return new Set(submissions.filter((s) => s.status === "Success").map((s) => s.questionId));
  }, [submissions]);

  const primaryLanguage = useMemo(() => {
    if (submissions.length === 0) return { name: "None", percent: 0 };
    const counts: Record<string, number> = {};
    for (const s of submissions) {
      const lang = s.language.toLowerCase();
      counts[lang] = (counts[lang] || 0) + 1;
    }
    let topLang = "python";
    let topCount = 0;
    for (const [lang, count] of Object.entries(counts)) {
      if (count > topCount) {
        topCount = count;
        topLang = lang;
      }
    }
    const labelMap: Record<string, string> = {
      python: "Python 3",
      cpp: "C++ 17",
      javascript: "JavaScript",
    };
    return {
      name: labelMap[topLang] || topLang.toUpperCase(),
      percent: Math.round((topCount / submissions.length) * 100),
    };
  }, [submissions]);

  const selectedEditorial = selectedSub ? getProblemMetadata(selectedSub.questionId) : null;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary font-sans">
      <Navbar />

      <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Section with Tactical Telemetry Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-semibold">
                Audited Telemetry Log
              </span>
              <span className="text-text-muted text-xs">•</span>
              <span className="font-mono text-xs text-text-muted">Node: judge-cluster-eu-west-04</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              Submissions Ledger
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl font-sans">
              Review evaluation verdicts, memory profiles, runtime percentiles, and inspect source snapshots across global test suites.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-hover text-text-secondary hover:text-text-primary text-xs font-medium transition-all shadow-xs border border-white/5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-container hover:bg-brand-wine-deep text-on-primary-container text-xs font-semibold tracking-wide transition-all shadow-md shadow-primary-container/20 active:scale-[0.98]"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>New Benchmark</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-status-error/30 bg-status-error/10 px-4 py-3 text-xs text-status-error">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* 4-Up Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="rounded-xl bg-surface-container p-5 border border-white/5 transition-transform duration-200 hover:-translate-y-0.5 shadow-xl">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                Total Submissions
              </span>
              <Terminal className="h-4 w-4 text-text-muted" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-text-primary">{submissions.length}</span>
              <span className="font-mono text-xs text-tertiary font-medium">{recentCount} this wk</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span>Evaluated across test suites</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl bg-surface-container p-5 border border-white/5 transition-transform duration-200 hover:-translate-y-0.5 shadow-xl">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                Accepted Solutions
              </span>
              <CheckCircle2 className="h-4 w-4 text-status-accepted" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-text-primary">{acceptedCount}</span>
              <span className="font-mono text-xs px-1.5 py-0.5 rounded-full bg-status-accepted/10 text-status-accepted font-semibold">
                {acceptanceRate}% Rate
              </span>
            </div>
            <div className="mt-3 w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
              <div className="bg-status-accepted h-full rounded-full" style={{ width: `${Math.min(acceptanceRate, 100)}%` }} />
            </div>
          </div>

          {/* Card 3: Unique Problems Solved */}
          <div className="rounded-xl bg-surface-container p-5 border border-white/5 transition-transform duration-200 hover:-translate-y-0.5 shadow-xl">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                Challenges Solved
              </span>
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-text-primary">
                {solvedProblemIds.size}
              </span>
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-medium">
                Unique
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-text-muted truncate">
              <span>{Object.keys(questionTitles).length || 10} Total catalog challenges</span>
            </div>
          </div>

          {/* Card 4: Primary Language */}
          <div className="rounded-xl bg-surface-container p-5 border border-white/5 transition-transform duration-200 hover:-translate-y-0.5 shadow-xl">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                Primary Language
              </span>
              <Cpu className="h-4 w-4 text-status-warning" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-text-primary">{primaryLanguage.name}</span>
              {submissions.length > 0 && (
                <span className="font-mono text-xs text-status-accepted font-semibold">{primaryLanguage.percent}%</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
              <span>Most frequent evaluation target</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Command Strip */}
        <div className="flex flex-col lg:flex-row gap-3 p-2 rounded-xl bg-surface-container/70 backdrop-blur-md border border-white/5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Filter by problem name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-12 py-2 rounded-lg bg-surface-elevated text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:bg-surface-hover transition-colors border border-white/5"
            />
            <kbd className="font-mono text-[10px] text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 bg-surface-container-high px-1.5 py-0.5 rounded select-none">
              ⌘K
            </kbd>
          </div>

          {/* Language Filters */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <span className="font-mono text-[10px] uppercase text-text-muted px-2 shrink-0">Lang:</span>
            {["All", "Python", "cpp", "javascript"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguageFilter(lang)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  languageFilter.toLowerCase() === lang.toLowerCase()
                    ? "bg-primary-container text-on-primary-container shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                }`}
              >
                {lang === "cpp" ? "C++" : lang === "javascript" ? "JS" : lang}
              </button>
            ))}
          </div>

          {/* Verdict Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="font-mono text-[10px] uppercase text-text-muted px-2 shrink-0">Verdict:</span>
            {(["All", "Success", "WrongAnswer"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setStatusFilter(v)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  statusFilter === v
                    ? "bg-surface-elevated text-text-primary border border-white/10 font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                }`}
              >
                {v === "Success" ? "Accepted" : v === "WrongAnswer" ? "Wrong Answer" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Main Workspace Split: Table (65%) & Inspector Drawer (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Submissions Table (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col bg-surface-container rounded-xl overflow-hidden shadow-lg border border-white/5">
            {/* Table Top Meta Bar */}
            <div className="px-5 py-3.5 bg-surface-container-high/60 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm text-text-primary font-semibold">Evaluation Log</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container-highest text-text-muted">
                  {filteredSubmissions.length} runs displayed
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-status-accepted animate-pulse" />
                <span>Judge Sync OK</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-high/30 font-mono text-[10px] uppercase text-text-muted tracking-wider border-b border-white/5">
                    <th className="py-3 px-4 font-semibold">Verdict</th>
                    <th className="py-3 px-4 font-semibold">Problem</th>
                    <th className="py-3 px-4 font-semibold">Pass Rate</th>
                    <th className="py-3 px-4 font-semibold">Verification</th>
                    <th className="py-3 px-4 font-semibold">Language</th>
                    <th className="py-3 px-4 font-semibold">Submitted</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                        <div className="inline-flex items-center gap-2 font-mono text-xs">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
                          <span>Retrieving submissions ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-text-muted text-xs">
                        No submissions recorded matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const isSelected = selectedSub?.id === sub.id;
                      return (
                        <tr
                          key={sub.id}
                          onClick={() => setSelectedSub(sub)}
                          className={`group hover:bg-surface-hover/50 cursor-pointer transition-colors ${
                            isSelected ? "bg-surface-hover/70" : ""
                          }`}
                        >
                          {/* Verdict */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {sub.status === "Success" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-accepted/10 text-status-accepted font-mono font-semibold tracking-tight text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Accepted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-error/10 text-status-error font-mono font-semibold tracking-tight text-xs">
                                <XCircle className="h-3.5 w-3.5" />
                                {sub.status === "WrongAnswer" ? "Wrong Answer" : sub.status}
                              </span>
                            )}
                          </td>

                          {/* Problem Title */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-sans text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                                {questionTitles[sub.questionId] || sub.questionId}
                              </span>
                              <span className="font-mono text-[10px] text-text-muted">
                                #{sub.questionId}
                              </span>
                            </div>
                          </td>

                          {/* Pass Rate */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                            <span className={`font-semibold ${sub.status === "Success" ? "text-status-accepted" : "text-text-primary"}`}>
                              {Math.round((sub.passedCount / Math.max(sub.totalCount, 1)) * 100)}%
                            </span>
                          </td>

                          {/* Verification pass count */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-text-primary border border-white/5">
                              {sub.passedCount} / {sub.totalCount} Passed
                            </span>
                          </td>

                          {/* Language */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] text-text-secondary bg-surface-container-highest px-2 py-0.5 rounded border border-white/5 uppercase">
                              {sub.language}
                            </span>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-text-muted text-xs font-mono">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSub(sub);
                              }}
                              className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary font-mono text-xs px-2 py-1 rounded hover:bg-surface-elevated transition-all cursor-pointer"
                            >
                              <span>Inspect</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Slide-Over Code & Benchmark Inspector Drawer (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            {selectedSub ? (
              <div className="bg-surface-container rounded-xl overflow-hidden shadow-2xl flex flex-col border border-white/5">
                {/* Drawer Header */}
                <div className="p-4 bg-surface-container-high/80 flex flex-col gap-2 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-semibold text-xs ${
                          selectedSub.status === "Success"
                            ? "bg-status-accepted/15 text-status-accepted"
                            : "bg-status-error/15 text-status-error"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedSub.status === "Success" ? "bg-status-accepted" : "bg-status-error"}`} />
                        <span>{selectedSub.status === "Success" ? "Accepted" : selectedSub.status === "WrongAnswer" ? "Wrong Answer" : selectedSub.status}</span>
                      </span>
                      <span className="font-mono text-[11px] text-text-muted">
                        ID: #{selectedSub.id.slice(0, 8)}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-text-muted">
                      {new Date(selectedSub.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <h3 className="font-display text-sm text-text-primary font-bold">
                        {questionTitles[selectedSub.questionId] || selectedSub.questionId}
                      </h3>
                      <span className="text-xs text-text-muted font-mono uppercase">
                        Language: {selectedSub.language}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-mono text-[11px] font-semibold border border-primary/20">
                      Standard
                    </span>
                  </div>
                </div>

                {/* Verification Suite Evaluation Card */}
                <div className="p-4 bg-surface-elevated space-y-3 border-b border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider">
                      Verification Suite
                    </span>
                    <span className={`font-mono text-xs font-semibold ${selectedSub.status === "Success" ? "text-status-accepted" : "text-text-primary"}`}>
                      {selectedSub.passedCount} / {selectedSub.totalCount} Cases ({Math.round((selectedSub.passedCount / Math.max(selectedSub.totalCount, 1)) * 100)}%)
                    </span>
                  </div>

                  {/* Micro Jewels Visualization */}
                  <div
                    className="grid gap-1 w-full pt-1"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(selectedSub.totalCount || 10, 25)}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: selectedSub.totalCount || 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-[1px] ${
                          i < selectedSub.passedCount ? "bg-status-accepted" : "bg-status-error"
                        }`}
                        title={`Test Case ${i + 1}: ${i < selectedSub.passedCount ? "Passed" : "Failed"}`}
                      />
                    ))}
                  </div>

                  {/* Target Complexity & Approach Specs */}
                  {selectedEditorial && (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2 rounded bg-surface-container-high/60 flex flex-col border border-white/5">
                        <span className="font-mono text-[10px] text-text-muted uppercase">Target Complexity</span>
                        <span className="font-mono text-xs font-semibold text-text-primary mt-0.5">
                          {selectedEditorial.timeComplexity} • {selectedEditorial.spaceComplexity}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-surface-container-high/60 flex flex-col border border-white/5">
                        <span className="font-mono text-[10px] text-text-muted uppercase">Algorithmic Pattern</span>
                        <span className="font-mono text-xs font-semibold text-status-accepted mt-0.5 truncate" title={selectedEditorial.approach}>
                          {selectedEditorial.approach}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Judge Output Log if present */}
                  {selectedSub.output && (
                    <div className="p-2.5 rounded bg-surface-base border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted uppercase">
                        <span>Judge Output:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(selectedSub.output || "")}
                          className="hover:text-text-primary flex items-center gap-1 cursor-pointer font-sans normal-case"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="font-mono text-xs text-text-primary whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {selectedSub.output}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Code Viewer Panel */}
                <div className="flex flex-col bg-surface-base">
                  <div className="px-4 py-2 bg-surface-container-high flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                      <FileCode2 className="h-3.5 w-3.5 text-text-muted" />
                      <span className="font-mono text-xs text-text-primary font-medium">
                        solution_{selectedSub.language}.code
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(selectedSub.code)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary text-[11px] font-mono transition-colors cursor-pointer border border-white/5"
                      >
                        {copied ? <Check className="h-3 w-3 text-status-accepted" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? "Copied" : "Copy Code"}</span>
                      </button>

                      <Link
                        to={`/problem/${selectedSub.questionId}`}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-primary-container/20 hover:bg-primary-container text-primary hover:text-on-primary-container text-[11px] font-mono transition-all font-medium border border-primary/20"
                      >
                        <GitFork className="h-3 w-3" />
                        <span>Fork to IDE</span>
                      </Link>
                    </div>
                  </div>

                  <div className="h-64 overflow-hidden">
                    <MonacoEditor
                      height="100%"
                      language={selectedSub.language === "cpp" ? "cpp" : selectedSub.language}
                      value={selectedSub.code}
                      theme="obsidian-precision"
                      options={{
                        readOnly: true,
                        domReadOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        lineNumbers: "on",
                        renderLineHighlight: "none",
                        padding: { top: 8, bottom: 8 },
                        scrollbar: { verticalScrollbarSize: 5 },
                        overviewRulerBorder: false,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container rounded-xl p-8 text-center text-text-muted text-xs border border-white/5">
                Select a submission row from the ledger to inspect source code and benchmark telemetry.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}