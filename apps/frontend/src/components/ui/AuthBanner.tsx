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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1 font-mono text-[11px] font-medium tracking-wide text-foreground shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-pass" />
          The Algorithm Atelier • Online
        </span>
      </div>

      {/* Headline */}
      <div className="space-y-4">
        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Craft logic.
          <br />
          Execute with <span className="italic font-normal text-primary">distinction.</span>
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          A bespoke, focused sanctuary designed for deliberate algorithm practice. Real compilation, real test vectors, zero simulations.
        </p>
      </div>

      <Separator className="bg-border/60" />

      {/* Feature list */}
      <div className="space-y-5">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-card text-primary shadow-[0_1px_3px_rgba(93,7,3,0.08)]">
              <feature.icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {feature.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}