import { CheckCircle2, Code2, History, Terminal } from "lucide-react";

import AtelierLogo from "./AtelierLogo";

const FEATURES = [
  {
    icon: Code2,
    title: "Monaco editor",
    description: "Write Python, C++, or JavaScript with syntax highlighting and keyboard shortcuts.",
  },
  {
    icon: Terminal,
    title: "Run and submit",
    description: "Test against sample cases, then submit against the full test suite.",
  },
  {
    icon: History,
    title: "Submission history",
    description: "Review every verdict and reopen your previous solutions.",
  },
];

export default function AuthBanner() {
  return (
    <div className="flex flex-col justify-between gap-8 rounded-xl border border-border-hairline bg-surface-elevated/70 p-8">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AtelierLogo size={36} />
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-text-primary">
              AtelierCode
            </p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
              Practice workspace
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="max-w-md font-display text-3xl font-semibold leading-tight tracking-tight text-text-primary">
            Practice problems with real feedback.
          </h2>
          <p className="max-w-md text-sm leading-6 text-text-secondary">
            A focused environment for writing code, running tests, and tracking your progress over
            time.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border-hairline bg-surface-base">
          <div className="flex items-center gap-2 border-b border-border-hairline bg-surface-container-low px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-status-error/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-status-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-status-accepted/70" />
            <span className="ml-2 font-mono text-[11px] text-text-muted">solution.py</span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-text-secondary">
            <code>
              <span className="text-[#fb7185]">def</span>{" "}
              <span className="text-[#60a5fa]">two_sum</span>(nums, target):
              {"\n"}
              {"    "}seen = {"{}"}
              {"\n"}
              {"    "}
              <span className="text-[#fb7185]">for</span> i, value{" "}
              <span className="text-[#fb7185]">in</span>{" "}
              <span className="text-[#60a5fa]">enumerate</span>(nums):
              {"\n"}
              {"        "}complement = target - value
              {"\n"}
              {"        "}
              <span className="text-[#fb7185]">if</span> complement{" "}
              <span className="text-[#fb7185]">in</span> seen:
              {"\n"}
              {"            "}
              <span className="text-[#fb7185]">return</span> [seen[complement], i]
              {"\n"}
              {"        "}seen[value] = i
              {"\n"}
              {"    "}
              <span className="text-[#fb7185]">return</span> []
            </code>
          </pre>
          <div className="flex items-center gap-2 border-t border-border-hairline bg-surface-container-low/50 px-4 py-2.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-status-accepted" />
            <span className="font-mono text-[11px] text-status-accepted">
              8 / 8 test cases passed
            </span>
          </div>
        </div>
      </div>

      <ul className="space-y-4">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-hairline bg-surface-container text-text-secondary">
              <feature.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-primary">{feature.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-text-muted">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
