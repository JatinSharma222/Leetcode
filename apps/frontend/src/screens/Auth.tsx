import AuthBanner from "@/components/ui/AuthBanner";
import AuthCredentials from "@/components/ui/AuthCredentials";

export default function Auth() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-surface-base font-sans">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary-container/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full bg-brand-wine-deep/15 blur-[160px]" />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="order-1">
          <AuthCredentials />
        </div>
        <div className="order-2 hidden lg:block">
          <AuthBanner />
        </div>
      </div>
    </main>
  );
}
