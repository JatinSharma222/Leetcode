import { useEffect, useRef, useState } from "react";
import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import { Check, Code2, Copy, Map, Maximize2, Minimize2, RotateCcw } from "lucide-react";

import { defineObsidianTheme, OBSIDIAN_THEME } from "@/lib/monaco";

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: string;
  onReset?: () => void;
  disabled?: boolean;
}

const FILE_NAME_MAP: Record<string, string> = {
  python: "solution.py",
  cpp: "solution.cpp",
  javascript: "solution.js",
};

export default function CodeEditor({
  code,
  onChange,
  language,
  onReset,
  disabled = false,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [minimapEnabled, setMinimapEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    defineObsidianTheme(monaco);
    monaco.editor.setTheme(OBSIDIAN_THEME);
    editor.focus();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by the browser; leave the editor as-is.
    }
  };

  const fileName = FILE_NAME_MAP[language] || "solution.txt";

  return (
    <div
      ref={containerRef}
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-border-hairline bg-surface-base ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : ""
      }`}
    >
      <div className="flex h-9 shrink-0 select-none items-center justify-between border-b border-border-hairline bg-surface-elevated px-3">
        <div className="flex h-full items-center gap-2 font-mono text-xs text-text-primary">
          <Code2 className="h-3.5 w-3.5 text-[#38bdf8]" />
          <span>{fileName}</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-text-muted">
          <span className="hidden uppercase sm:inline">{language}</span>

          <div className="flex items-center gap-0.5 border-l border-border-hairline pl-2">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy code"
              title="Copy code"
              className="rounded p-1 transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-status-accepted" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                aria-label="Reset to starter code"
                title="Reset to starter code"
                className="rounded p-1 transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setMinimapEnabled((prev) => !prev)}
              aria-label={minimapEnabled ? "Hide minimap" : "Show minimap"}
              aria-pressed={minimapEnabled}
              title="Toggle minimap"
              className="rounded p-1 transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <Map className={`h-3.5 w-3.5 ${minimapEnabled ? "text-primary" : ""}`} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="rounded p-1 transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorMount}
          theme={OBSIDIAN_THEME}
          options={{
            readOnly: disabled,
            minimap: { enabled: minimapEnabled },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            scrollBeyondLastLine: false,
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  );
}
