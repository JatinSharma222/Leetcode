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
} from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import Navbar from "@/components/ui/Navbar";
import type { Submission } from "@/lib/types";
import { ApiError, fetchQuestions, fetchUserSubmissions } from "@/lib/api";

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
          setSelectedSub(subs[0]);
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
              <span className="font-mono text-xs text-tertiary font-medium">+18 this wk</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span>Across unique algorithmic problems</span>
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

          {/* Card 3 */}
          <div className="rounded-xl bg-surface-container p-5 border border-white/5 transition-transform duration-200 hover:-translate-y-0.5 shadow-xl">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                Fastest Runtime
              </span>
              <span className="text-status-warning text-xs">⚡</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-text-primary">
                18<span className="text-sm font-normal text-text-muted ml-0.5 font-sans">ms</span>
              </span>
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-medium">
                Record
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-text-muted truncate">
              <span className="truncate">Two Sum / Substring</span>
              <span className="font-mono text-text-secondary shrink-0">O(N)</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl bg-surface-container p-5 border border-white/5 transition-transform duration-200 hover:-translate-y-0.5 shadow-xl">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                Average Percentile
              </span>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-text-primary">94.2%</span>
              <span className="font-mono text-xs text-status-accepted font-semibold">Top 5% Tier</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
              <span className="text-status-accepted text-xs">📈</span>
              <span>Efficiency score higher than 94.2% peers</span>
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
                    <th className="py-3 px-4 font-semibold">Runtime</th>
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

                          {/* Runtime */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                            <span className="text-text-primary font-medium">18 ms</span>
                            <span className="text-status-accepted text-[10px] ml-1.5">(94.2%)</span>
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
                        <span className="w-1.5 h-1.5 rounded-full bg-status-accepted animate-ping" />
                        <span>{selectedSub.status === "Success" ? "Accepted (18ms)" : selectedSub.status}</span>
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
                      <span className="text-xs text-text-muted font-mono">
                        Language: {selectedSub.language}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-mono text-[11px] font-semibold border border-primary/20">
                      Standard
                    </span>
                  </div>
                </div>

                {/* Benchmark Percentile Distribution Chart */}
                <div className="p-4 bg-surface-elevated space-y-3 border-b border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider">
                      Runtime Distribution
                    </span>
                    <span className="font-mono text-xs font-semibold text-status-accepted">
                      You (18ms) • Beats 94.2%
                    </span>
                  </div>

                  {/* Inline Bell-Curve Distribution Histogram SVG */}
                  <div className="relative w-full pt-1 pb-2">
                    <svg className="w-full h-24 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 120">
                      <defs>
                        <linearGradient id="curveGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#E11D48" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#E11D48" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line stroke="#353439" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="400" y1="100" y2="100" />
                      <line stroke="#353439" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="400" y1="50" y2="50" />
                      <path
                        d="M 10 100 Q 60 100 80 88 T 130 50 T 180 20 T 230 40 T 290 85 T 390 100 L 390 100 L 10 100 Z"
                        fill="url(#curveGradient)"
                      />
                      <path
                        d="M 10 100 Q 60 100 80 88 T 130 50 T 180 20 T 230 40 T 290 85 T 390 100"
                        fill="none"
                        stroke="#E11D48"
                        strokeWidth="2"
                      />
                      <line stroke="#10B981" strokeLinecap="round" strokeWidth="2" x1="68" x2="68" y1="15" y2="100" />
                      <circle cx="68" cy="18" fill="#10B981" r="4.5" stroke="#0B0B0F" strokeWidth="2" />
                      <line stroke="#6B7280" strokeDasharray="3 3" strokeWidth="1" x1="180" x2="180" y1="20" y2="100" />
                      <circle cx="180" cy="20" fill="#6B7280" r="3" />
                    </svg>

                    <div className="flex justify-between font-mono text-[10px] text-text-muted mt-1 px-1">
                      <span>12ms</span>
                      <span className="text-status-accepted font-semibold">18ms (You)</span>
                      <span>48ms (Median)</span>
                      <span>120ms</span>
                      <span>240ms+</span>
                    </div>
                  </div>

                  {/* Quick Compare Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="p-2 rounded bg-surface-container-high/60 flex flex-col border border-white/5">
                      <span className="font-mono text-[10px] text-text-muted uppercase">Memory Rank</span>
                      <span className="font-mono text-xs font-semibold text-text-primary mt-0.5">
                        16.2 MB <span className="text-status-accepted text-[10px]">(88.5%)</span>
                      </span>
                    </div>
                    <div className="p-2 rounded bg-surface-container-high/60 flex flex-col border border-white/5">
                      <span className="font-mono text-[10px] text-text-muted uppercase">Complexity</span>
                      <span className="font-mono text-xs font-semibold text-text-primary mt-0.5">
                        O(N) Time • O(1) Space
                      </span>
                    </div>
                  </div>
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