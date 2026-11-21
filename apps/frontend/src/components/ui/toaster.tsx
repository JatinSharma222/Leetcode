import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            "border border-border-hairline bg-surface-elevated text-text-primary shadow-lg",
          description: "text-text-muted",
          actionButton: "bg-primary-container text-white",
          cancelButton: "bg-surface-hover text-text-secondary",
        },
      }}
    />
  );
}
