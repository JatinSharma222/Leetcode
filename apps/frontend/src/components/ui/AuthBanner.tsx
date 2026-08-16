import { Terminal as TerminalIcon, Zap, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: TerminalIcon,
    title: "Real execution, not a linter",
    description: "Your code actually compiles and runs against real test cases — no simulated results.",
  },
  {
    icon: Zap,
    title: "Instant feedback",
    description: "Submit and watch the test strip fill in as your solution is judged.",
  },
  {
    icon: CheckCircle2,
    title: "A record that means something",
    description: "Every submission is logged — pass counts, output, the works.",
  },
];

export default function AuthBanner() {
  return (
    <div id="auth-banner" className="flex flex-col gap-8">
      {/* Badge */}
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 font-mono text-[11px] font-medium tracking-wide text-neutral-500">
          <span className="h-1.5 w-1.5 rounded-full bg-pass" />
          status: online
        </span>
      </div>

      {/* Headline */}
      <div className="space-y-4">
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
          Write code.
          <br />
          Run it <span className="text-circuit">for real.</span>
        </h1>
        <p className="max-w-md text-base leading-relaxed text-neutral-500">
          A calm, focused workspace to sharpen your problem-solving skills — every
          submission actually compiles and runs, no simulations.
        </p>
      </div>

      <Separator className="bg-neutral-200" />

      {/* Feature list */}
      <div className="space-y-5">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-circuit">
              <feature.icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                {feature.title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}