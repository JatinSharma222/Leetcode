import React, { useRef, useState } from "react";
import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import { Copy, RotateCcw, Check, Maximize2, Minimize2, Code2, Map } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: string;
  onRun?: () => void;
  onSubmit?: () => void;
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
  onRun,
  onSubmit,
  onReset,
  disabled = false,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [minimapEnabled, setMinimapEnabled] = useState(false);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Cmd/Ctrl + Enter shortcut for submit
    editor.addAction({
      id: "submit-code",
      label: "Submit Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        onSubmit?.();
      },
    });

    // Register Cmd/Ctrl + ' shortcut for run code
    editor.addAction({
      id: "run-code",
      label: "Run Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Quote],
      run: () => {
        onRun?.();
      },
    });

    // Define Obsidian Precision theme
    monaco.editor.defineTheme("obsidian-precision", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "F43F5E", fontStyle: "bold" },
        { token: "string", foreground: "34D399" },
        { token: "number", foreground: "A78BFA" },
        { token: "type", foreground: "38BDF8" },
        { token: "function", foreground: "60A5FA" },
        { token: "variable", foreground: "F9FAFB" },
        { token: "operator", foreground: "F43F5E" },
        { token: "delimiter", foreground: "9CA3AF" },
        { token: "identifier", foreground: "F9FAFB" },
      ],
      colors: {
        "editor.background": "#0B0B0F",
        "editor.foreground": "#F9FAFB",
        "editor.lineHighlightBackground": "#16161F",
        "editor.selectionBackground": "#E11D4840",
        "editorCursor.foreground": "#E11D48",
        "editorLineNumber.foreground": "#4B5563",
        "editorLineNumber.activeForeground": "#F9FAFB",
        "editor.selectionHighlightBackground": "#E11D4820",
        "editorBracketMatch.background": "#E11D4830",
        "editorBracketMatch.border": "#E11D4880",
        "editorIndentGuide.background": "#1F1F28",
        "editorIndentGuide.activeBackground": "#374151",
        "editorGutter.background": "#0E0E12",
        "scrollbarSlider.background": "#FFFFFF15",
        "scrollbarSlider.hoverBackground": "#FFFFFF25",
      },
    });

    monaco.editor.setTheme("obsidian-precision");
    editor.focus();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const fileName = FILE_NAME_MAP[language] || "solution.txt";

  return (
    <div
      ref={containerRef}
      className={`flex h-full flex-col rounded-xl border border-white/5 bg-surface-base overflow-hidden shadow-xl ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : ""
      }`}
    >
      {/* Editor Header Bar */}
      <div className="h-9 bg-surface-elevated px-3 flex items-center justify-between shrink-0 border-b border-white/5 select-none">
        <div className="flex items-center h-full">
          <div className="flex items-center gap-2 px-3 h-full bg-surface-base font-mono text-xs text-text-primary font-medium border-r border-white/5 shadow-xs">
            <Code2 className="h-3.5 w-3.5 text-[#38BDF8]" />
            <span>{fileName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-text-muted">
          <span className="hidden sm:inline">Spaces: 4</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="uppercase">{language}</span>

          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              type="button"
              onClick={handleCopy}
              title="Copy solution code"
              className="p-1 hover:text-text-primary rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-status-accepted" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                title="Reset to starter template"
                className="p-1 hover:text-text-primary rounded transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMinimapEnabled((prev) => !prev)}
              title="Toggle Minimap"
              className="p-1 hover:text-text-primary rounded transition-colors cursor-pointer"
            >
              <Map className={`h-3.5 w-3.5 ${minimapEnabled ? "text-primary" : ""}`} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-1 hover:text-text-primary rounded transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <MonacoEditor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(val) => onChange(val || "")}
          onMount={handleEditorMount}
          theme="obsidian-precision"
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
            cursorSmoothCaretAnimation: "on",
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