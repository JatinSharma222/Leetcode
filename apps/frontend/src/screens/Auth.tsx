import React from "react";
import AuthBanner from "@/components/ui/AuthBanner";
import AuthCredentials from "@/components/ui/AuthCredentials";

export default function Auth() {
  return (
    <main className="w-full bg-surface-base min-h-screen flex flex-col justify-center font-sans">
      <div className="relative w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden">
        {/* Ambient Luminous Mesh Accents */}
        <div className="absolute -top-32 -left-20 w-[540px] h-[540px] bg-primary-container/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-36 -right-24 w-[480px] h-[480px] bg-brand-wine-deep/20 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-surface-container-lowest/70 pointer-events-none -z-10" />

        {/* Main 50/50 Split Frame */}
        <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch my-auto">
          <div className="lg:col-span-6 flex flex-col">
            <AuthBanner />
          </div>
          <div className="lg:col-span-6 flex flex-col justify-center">
            <AuthCredentials />
          </div>
        </div>
      </div>
    </main>
  );
}