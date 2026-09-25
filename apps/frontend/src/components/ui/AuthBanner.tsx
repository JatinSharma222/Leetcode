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

        {/* Interactive Algorithmic Telemetry & Benchmark Visualizer */}
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
                telemetry://judge.stream.matrix
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-text-muted flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-accepted animate-pulse" />
                P99: <span className="text-status-accepted font-semibold">0.94ms</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-hover text-text-secondary border border-white/5 text-[10px]">
                SANDBOX READY
              </span>
            </div>
          </div>

          {/* Telemetry Body: Global Nodes & Real-time Waveform */}
          <div className="p-4 space-y-4">
            {/* Real-Time Execution Latency Chart (SVG) */}
            <div className="relative rounded-lg bg-surface-base/90 p-3 border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-text-secondary uppercase tracking-wider font-semibold">
                    Global Latency Sweep
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary-container/20 text-primary border border-primary/20">
                    LIVE STREAM
                  </span>
                </div>
                <span className="font-mono text-[11px] text-text-muted">Jitter ±0.04ms</span>
              </div>

              {/* SVG Interactive Latency Graph */}
              <div className="relative h-28 w-full">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 460 100">
                  <defs>
                    <linearGradient id="latencyGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#e11d48" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="latencyLine" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#ffb3b6" />
                      <stop offset="50%" stopColor="#e11d48" />
                      <stop offset="100%" stopColor="#4edea3" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" x1="0" x2="460" y1="20" y2="20" />
                  <line stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" x1="0" x2="460" y1="50" y2="50" />
                  <line stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" x1="0" x2="460" y1="80" y2="80" />
                  {/* Area Fill */}
                  <path d="M 0,65 Q 40,42 90,52 T 180,32 T 270,48 T 360,24 T 460,38 L 460,100 L 0,100 Z" fill="url(#latencyGlow)" />
                  {/* Dynamic Waveform Trace */}
                  <path d="M 0,65 Q 40,42 90,52 T 180,32 T 270,48 T 360,24 T 460,38" fill="none" stroke="url(#latencyLine)" strokeLinecap="round" strokeWidth="2.5" />
                  {/* Sampling Points */}
                  <g transform="translate(180, 32)">
                    <circle className="animate-ping opacity-75" fill="#e11d48" r="6" />
                    <circle fill="#fff" r="3.5" stroke="#e11d48" strokeWidth="2" />
                  </g>
                  <g transform="translate(360, 24)">
                    <circle className="animate-ping opacity-60" fill="#4edea3" r="6" />
                    <circle fill="#fff" r="3.5" stroke="#4edea3" strokeWidth="2" />
                  </g>
                </svg>

                {/* Floating Tooltip */}
                <div className="absolute top-2 right-10 px-2 py-1 rounded bg-surface-hover/95 border border-primary/30 backdrop-blur-md shadow-lg pointer-events-none">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-accepted" />
                    <span className="text-text-muted">US-East:</span>
                    <span className="text-status-accepted font-semibold">0.82ms</span>
                  </div>
                </div>
              </div>

              {/* Distributed Nodes */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/5">
                <div className="flex flex-col p-1.5 rounded bg-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-muted">US-East (N.VA)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-status-accepted" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-xs text-text-primary font-semibold">0.8ms</span>
                    <span className="font-mono text-[9px] text-status-accepted">cold: 1.1ms</span>
                  </div>
                </div>

                <div className="flex flex-col p-1.5 rounded bg-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-muted">EU-Central (FRA)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-status-accepted" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-xs text-text-primary font-semibold">1.2ms</span>
                    <span className="font-mono text-[9px] text-status-accepted">cold: 1.4ms</span>
                  </div>
                </div>

                <div className="flex flex-col p-1.5 rounded bg-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-muted">AP-East (TYO)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-status-accepted" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-xs text-text-primary font-semibold">1.0ms</span>
                    <span className="font-mono text-[9px] text-status-accepted">cold: 1.3ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Suite Telemetry Box */}
            <div className="p-3 rounded-lg bg-surface-container-high/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 border border-status-accepted/30 flex items-center justify-center shrink-0">
                  <span className="text-status-accepted text-xs font-bold">✓</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary truncate">
                      Suite: Dynamic Programming
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-status-accepted/10 text-status-accepted font-medium">
                      84/84 PASS
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted font-mono text-[11px] mt-0.5">
                    <span>Memory: <strong className="text-text-primary font-normal">14.2 MB</strong></span>
                    <span>•</span>
                    <span>Complexity: <strong className="text-primary font-normal">O(N log N)</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <span className="font-mono text-[11px] text-text-muted">Compiler VM:</span>
                <span className="font-mono text-[11px] text-primary bg-primary-container/20 px-2 py-0.5 rounded border border-primary/20">
                  Wasm-Native
                </span>
              </div>
            </div>
          </div>

          {/* Live Feed Bar */}
          <div className="px-4 py-2.5 bg-surface-container-low/90 border-t border-white/5 flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-wine-deep to-primary-container flex items-center justify-center text-[10px] font-bold text-white">
                AX
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-accepted flex items-center justify-center text-[7px] text-black font-bold">
                ✓
              </div>
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 truncate">
                <p className="text-xs text-text-primary truncate">
                  Alex solved <span className="text-white font-medium">'Two Sum'</span>
                </p>
                <span className="font-mono text-[10px] text-text-muted">3m ago</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-status-accepted bg-status-accepted/10 px-1.5 py-0.5 rounded">
                  12ms runtime
                </span>
                <span className="font-mono text-[10px] text-status-warning bg-status-warning/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  🔥 +50 XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Ticker & Badges */}
      <div className="space-y-3 pt-2 relative z-10">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-container-low shadow-inner border border-white/5">
          <span className="text-status-warning text-xs">⚡</span>
          <span className="font-mono text-xs text-text-primary font-medium">14,820 submissions</span>
          <span className="text-xs text-text-muted">evaluated in the last 24 hours</span>
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-status-accepted/20 text-status-accepted">
            Global 99.98% SLA
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-high text-text-secondary text-xs border border-white/5">
            <span className="text-xs text-primary">⚡</span>
            <span>Zero-Latency Micro-Judge</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-high text-text-secondary text-xs border border-white/5">
            <span className="text-xs text-primary">⌨</span>
            <span>Monaco & Vim Modes</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-high text-text-secondary text-xs border border-white/5">
            <span className="text-xs text-primary">★</span>
            <span>Blind 75 & Top 150</span>
          </div>
        </div>
      </div>
    </div>
  );
}