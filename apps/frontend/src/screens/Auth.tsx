import AuthBanner from "@/components/ui/AuthBanner";
import AuthCredentials from "@/components/ui/AuthCredentials";

export default function Auth() {
  return (
    <main
      id="auth-page"
      className="relative min-h-screen overflow-hidden bg-neutral-50"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-neutral-200/40 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <AuthBanner />
          <AuthCredentials />
        </div>
      </div>
    </main>
  );
}