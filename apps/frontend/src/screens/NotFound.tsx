import { Link } from "react-router";
import { ArrowLeft, Compass } from "lucide-react";

import Navbar from "@/components/ui/Navbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { usePageTitle } from "@/lib/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");

  return (
    <div className="min-h-screen bg-surface-base font-sans text-text-primary">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-24">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="The page you are looking for does not exist or may have moved."
          action={
            <Button variant="secondary" asChild>
              <Link to="/">
                <ArrowLeft />
                Back to problems
              </Link>
            </Button>
          }
          className="w-full"
        />
      </main>
    </div>
  );
}
