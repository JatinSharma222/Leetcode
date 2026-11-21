import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("text-sm leading-7 text-text-secondary", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-6 font-display text-lg font-semibold text-text-primary first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 font-display text-base font-semibold text-text-primary first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 font-display text-sm font-semibold text-text-primary first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
          em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2 hover:text-text-primary"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-primary/40 pl-3 text-text-muted">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-border-hairline" />,
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-md border border-border-hairline bg-surface-base p-3 font-mono text-xs leading-6 text-text-primary [&>code]:bg-transparent [&>code]:p-0">
              {children}
            </pre>
          ),
          code: ({ className: codeClassName, children, ...props }) => (
            <code
              className={cn(
                "rounded bg-surface-container px-1 py-0.5 font-mono text-[12px] text-text-primary",
                codeClassName,
              )}
              {...props}
            >
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-md border border-border-hairline">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-container text-text-primary">{children}</thead>,
          th: ({ children }) => <th className="border-b border-border-hairline px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-border-hairline px-3 py-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
