import { Code2, Zap, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: Code2,
    title: "Curated Problems",
    description: "Hand-picked challenges across all difficulty levels.",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Real-time code execution with detailed test results.",
  },
  {
    icon: Shield,
    title: "Track Progress",
    description: "Monitor your growth with detailed analytics.",
  },
];

export default function AuthBanner() {
  return (
    <div id="auth-banner" className="flex flex-col gap-8">
      {/* Badge */}
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Open Platform
        </span>
      </div>

      {/* Headline */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
          Practice with
          <br />
          <span className="text-neutral-400">clarity.</span>
        </h1>
        <p className="max-w-md text-base leading-relaxed text-neutral-500">
          A calm, focused workspace to sharpen your problem-solving skills. Write
          code, run tests, and grow — without distractions.
        </p>
      </div>

      <Separator className="bg-neutral-200" />

      {/* Feature list */}
      <div className="space-y-5">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600">
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