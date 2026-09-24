import AuthBanner from "@/components/ui/AuthBanner";
import AuthCredentials from "@/components/ui/AuthCredentials";

export default function Auth() {
  return (
    <main
      id="auth-page"
      className="relative min-h-screen overflow-hidden bg-background"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(rgba(93, 7, 3, 0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#5D0703]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#8B7032]/10 blur-3xl" />

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