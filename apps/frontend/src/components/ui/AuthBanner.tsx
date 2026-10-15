import React from "react";
import AtelierLogo from "./AtelierLogo";

export default function AuthBanner() {
  return (
    <div className="flex flex-col justify-between p-6 sm:p-10 rounded-2xl bg-surface-elevated/70 backdrop-blur-xl shadow-2xl relative overflow-hidden border border-white/5">
      {/* Subtle radial sheen on card edge */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary-container/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Brand Identity Row */}
      <div className="space-y-6 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AtelierLogo size={40} />
            <div className="flex flex-col">
              <span className="font-headline-sm text-lg font-bold tracking-tight text-text-primary">
                AtelierCode
              </span>
              <span className="font-mono text-[10px] text-text-muted tracking-wider uppercase font-semibold">
                HIGH-PERFORMANCE RUNTIME V2.4
              </span>
            </div>
          </div>

          {/* Micro-pill Live Judge Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-hover shadow-sm border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-accepted opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-accepted" />
            </span>
            <span className="font-mono text-xs text-status-accepted tracking-wider font-semibold">
              v2.4 Live Judge
            </span>
          </div>
        </div>

        {/* Hero Typography */}
        <div className="space-y-2.5 pt-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight leading-tight">
            Master algorithms with{" "}
            <span className="bg-gradient-to-r from-[#FFB3B6] via-[#FFDADA] to-white bg-clip-text text-transparent">
              zero latency
            </span>
            .
          </h1>
          <p className="font-sans text-sm text-text-secondary leading-relaxed max-w-xl">
            The developer-first online judge combining Linear-grade ergonomics, instant compiler feedback, and habit-forming gamification.
          </p>
        </div>

        {/* Algorithmic Sandbox Preview Card */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-surface-container-lowest/80 backdrop-blur-md border border-white/10 my-4 group">
          {/* Ambient Glow Layer */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-brand-wine-deep/20 rounded-full blur-2xl pointer-events-none" />

          {/* Visualizer Header Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/70 border-b border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="ml-2 font-mono text-xs text-text-muted flex items-center gap-1">
                solution.py
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-surface-hover text-text-secondary border border-white/5 text-[10px]">
                Python 3 • C++ 17 • JavaScript
              </span>
            </div>
          </div>

          {/* Code & Evaluation Preview */}
          <div className="p-4 space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-surface-base/90 border border-white/5 text-text-secondary leading-relaxed overflow-x-auto">
              <p><span className="text-[#F43F5E] font-semibold">def</span> <span className="text-[#60A5FA]">twoSum</span>(nums: <span className="text-[#38BDF8]">list</span>[<span className="text-[#38BDF8]">int</span>], target: <span className="text-[#38BDF8]">int</span>) -&gt; <span className="text-[#38BDF8]">list</span>[<span className="text-[#38BDF8]">int</span>]:</p>
              <p className="pl-4 text-text-muted"># Hash map for O(N) single-pass lookup</p>
              <p className="pl-4">seen = &#123;&#125;</p>
              <p className="pl-4"><span className="text-[#F43F5E] font-semibold">for</span> i, n <span className="text-[#F43F5E] font-semibold">in</span> <span className="text-[#60A5FA]">enumerate</span>(nums):</p>
              <p className="pl-8">diff = target - n</p>
              <p className="pl-8"><span className="text-[#F43F5E] font-semibold">if</span> diff <span className="text-[#F43F5E] font-semibold">in</span> seen:</p>
              <p className="pl-12"><span className="text-[#F43F5E] font-semibold">return</span> [seen[diff], i]</p>
              <p className="pl-8">seen[n] = i</p>
              <p className="pl-4"><span className="text-[#F43F5E] font-semibold">return</span> []</p>
            </div>

            {/* Test Vector Evaluation Strip */}
            <div className="p-3 rounded-lg bg-surface-container-high/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 border border-status-accepted/30 flex items-center justify-center shrink-0">
                  <span className="text-status-accepted text-xs font-bold">✓</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary truncate">
                      Sample Vector: nums = [2,7,11,15], target = 9
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted font-mono text-[11px] mt-0.5">
                    <span className="text-status-accepted">Output: [0, 1]</span>
                    <span>•</span>
                    <span>Expected: [0, 1]</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <span className="font-mono text-[10px] text-status-accepted bg-status-accepted/10 px-2 py-0.5 rounded border border-status-accepted/20">
                  All Samples Passed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="space-y-3 pt-2 relative z-10">
        <div className="flex items-center flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-high text-text-secondary text-xs border border-white/5">
            <span className="text-xs text-primary">⚡</span>
            <span>Sub-second Code Runner</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-high text-text-secondary text-xs border border-white/5">
            <span className="text-xs text-primary">⌨</span>
            <span>Monaco IDE Keybindings</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-high text-text-secondary text-xs border border-white/5">
            <span className="text-xs text-primary">★</span>
            <span>Custom Testcases & Full Suite</span>
          </div>
        </div>
      </div>
    </div>
  );
}