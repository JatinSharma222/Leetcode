import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  CheckCircle2,
  XCircle,
  Code,
  ArrowUpRight,
  FileCode2,
  AlertTriangle,
  History,
  Copy,
  Check,
  Search,
} from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import Navbar from "@/components/ui/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "WrongAnswer">("All");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== "All" && sub.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const qTitle = (questionTitles[sub.questionId] || sub.questionId).toLowerCase();
        if (!qTitle.includes(searchQuery.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [submissions, statusFilter, searchQuery, questionTitles]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
              <History className="h-3.5 w-3.5" />
              Submission Registry
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Evaluation Ledger
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Audit execution history, examine source code, and inspect per-test verification results.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-3.5 py-1.5 rounded-lg border border-border bg-card text-foreground shadow-xs">
              {submissions.length} Recorded Runs
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-fail/30 bg-fail/10 px-4 py-3 text-sm text-fail">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Filters and search */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Search by challenge name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9.5 pl-9 text-xs border-border bg-card placeholder:text-muted-foreground/60 rounded-lg shadow-[inset_0_1px_2px_rgba(93,7,3,0.05)] focus-visible:ring-primary/20"
            />
          </div>

          <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs shadow-xs">
            {(["All", "Success", "WrongAnswer"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground font-semibold shadow-[0_1px_3px_rgba(93,7,3,0.2)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "Success" ? "Accepted" : st === "WrongAnswer" ? "Wrong Answer" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_4px_16px_rgba(93,7,3,0.06)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 w-36">Status</th>
                <th scope="col" className="px-5 py-3">Challenge</th>
                <th scope="col" className="px-5 py-3 w-28">Language</th>
                <th scope="col" className="px-5 py-3 w-36">Verification</th>
                <th scope="col" className="px-5 py-3 hidden sm:table-cell w-44">Timestamp</th>
                <th scope="col" className="px-5 py-3 text-right w-24">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2 font-mono text-xs">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Retrieving submissions...
                    </div>
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-xs">
                    {submissions.length === 0
                      ? "No submissions recorded yet."
                      : "No submissions match your current filter."}
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="group transition-colors hover:bg-secondary/40"
                  >
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {sub.status === "Success" ? (
                        <div className="flex items-center gap-1.5 text-pass font-semibold text-xs">
                          <CheckCircle2 className="h-4 w-4 text-pass" />
                          Accepted
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-fail font-semibold text-xs">
                          <XCircle className="h-4 w-4 text-fail" />
                          {sub.status === "WrongAnswer" ? "Wrong Answer" : sub.status}
                        </div>
                      )}
                    </td>

                    {/* Problem link */}
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      <Link
                        to={`/problem/${sub.questionId}`}
                        className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                      >
                        {questionTitles[sub.questionId] || sub.questionId}
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                      </Link>
                    </td>

                    {/* Language */}
                    <td className="px-5 py-3.5">
                      <span className="rounded-md border border-border/60 bg-secondary/70 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {sub.language}
                      </span>
                    </td>

                    {/* Passed count badge */}
                    <td className="px-5 py-3.5">
                      <Badge variant={sub.status === "Success" ? "success" : "destructive"}>
                        {sub.passedCount} / {sub.totalCount} Passed
                      </Badge>
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-muted-foreground font-mono">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>

                    {/* Code modal trigger */}
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedSub(sub)}
                        className="h-7 text-xs font-mono"
                      >
                        <FileCode2 className="h-3.5 w-3.5 mr-1 text-primary" />
                        Code
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CODE MODAL VIEWER */}
        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D0301]/75 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground text-lg">
                    {questionTitles[selectedSub.questionId] || selectedSub.questionId}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-3">
                  <span>
                    Language: <strong className="text-foreground">{selectedSub.language}</strong>
                  </span>
                  <span>
                    Status:{" "}
                    <strong className={selectedSub.status === "Success" ? "text-pass" : "text-fail"}>
                      {selectedSub.status}
                    </strong>
                  </span>
                  <span>
                    Tests: <strong className="text-foreground">{selectedSub.passedCount}/{selectedSub.totalCount}</strong>
                  </span>
                </div>

                <button
                  onClick={() => handleCopyCode(selectedSub.code)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-sans cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-pass" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy Code"}</span>
                </button>
              </div>

              <div className="h-80 rounded-xl border border-border overflow-hidden bg-[#460402]">
                <MonacoEditor
                  height="100%"
                  language={selectedSub.language === "cpp" ? "cpp" : selectedSub.language}
                  value={selectedSub.code}
                  theme="atelier-burgundy"
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineNumbers: "on",
                    renderLineHighlight: "none",
                    padding: { top: 10, bottom: 10 },
                    scrollbar: { verticalScrollbarSize: 7 },
                    overviewRulerBorder: false,
                  }}
                />
              </div>

              {selectedSub.output && (
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Diagnostic Trace
                  </span>
                  <pre className="p-2.5 rounded-lg border border-border bg-background/80 text-xs font-mono text-foreground max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {selectedSub.output}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedSub(null)}
                  className="text-xs"
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