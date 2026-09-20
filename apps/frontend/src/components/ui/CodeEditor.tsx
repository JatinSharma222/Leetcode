import React, { useRef, useState } from "react";
import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import { Copy, RotateCcw, Check, Maximize2, Minimize2, Settings, Type } from "lucide-react";
import { Button } from "./button";

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: string;
  onRun?: () => void;
  onSubmit?: () => void;
  onReset?: () => void;
  disabled?: boolean;
}

const LANGUAGE_MAP: Record<string, string> = {
  python: "python",
  cpp: "cpp",
  javascript: "javascript",
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
  const [fontSize, setFontSize] = useState<number>(13);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
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

    // Define custom dark theme inspired by LeetCode / One Dark
    monaco.editor.defineTheme("leetcode-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6a737d", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "d19a66" },
        { token: "type", foreground: "e5c07b" },
        { token: "function", foreground: "61afef" },
        { token: "variable", foreground: "e06c75" },
        { token: "operator", foreground: "56b6c2" },
        { token: "delimiter", foreground: "abb2bf" },
        { token: "identifier", foreground: "abb2bf" },
      ],
      colors: {
        "editor.background": "#141417",
        "editor.foreground": "#d1d5db",
        "editor.lineHighlightBackground": "#1e1e24",
        "editor.selectionBackground": "#333842",
        "editorCursor.foreground": "#ffa116",
        "editorLineNumber.foreground": "#4b5563",
        "editorLineNumber.activeForeground": "#e5e7eb",
        "editor.selectionHighlightBackground": "#33384280",
        "editorBracketMatch.background": "#ffa11620",
        "editorBracketMatch.border": "#ffa11680",
        "editorIndentGuide.background": "#26262e",
        "editorIndentGuide.activeBackground": "#40404c",
        "editorGutter.background": "#141417",
        "scrollbarSlider.background": "#3f3f4660",
        "scrollbarSlider.hoverBackground": "#52525b80",
      },
    });

    monaco.editor.setTheme("leetcode-dark");
    editor.focus();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

  const cycleFontSize = () => {
    setFontSize((prev) => (prev === 12 ? 14 : prev === 14 ? 16 : 12));
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full w-full rounded-xl border border-border bg-[#141417] overflow-hidden shadow-sm font-mono text-sm ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
    >
      {/* Editor Header Bar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-[#1a1a1f] px-3 select-none">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500/80" />
          <span className="h-2 w-2 rounded-full bg-amber-500/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase font-sans">
            Code Editor ({language})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={cycleFontSize}
            title={`Font size: ${fontSize}px (click to toggle)`}
            className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-neutral-800 text-[11px]"
          >
            <span className="font-sans font-semibold text-[10px]">{fontSize}</span>
          </Button>

          {onReset && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowConfirmReset(true)}
                title="Reset starter code"
                className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>

              {showConfirmReset && (
                <div className="absolute right-0 top-8 z-50 w-56 rounded-lg border border-border bg-[#1a1a1f] p-3 shadow-xl space-y-2.5 font-sans">
                  <p className="text-xs text-neutral-300 font-medium">Reset code to default?</p>
                  <p className="text-[11px] text-neutral-500">Your current changes will be discarded.</p>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmReset(false);
                        onReset();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded hover:bg-rose-500/30"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            title="Copy code"
            className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 overflow-hidden min-h-0">
        <MonacoEditor
          height="100%"
          language={LANGUAGE_MAP[language] || "plaintext"}
          value={code}
          onChange={(value) => onChange(value ?? "")}
          onMount={handleEditorMount}
          theme="leetcode-dark"
          loading={
            <div className="flex h-full items-center justify-center text-neutral-500 text-xs">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              Loading editor...
            </div>
          }
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            lineNumbers: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "off",
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoIndent: "full",
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            padding: { top: 10, bottom: 10 },
            readOnly: disabled,
            domReadOnly: disabled,
            scrollbar: {
              verticalScrollbarSize: 7,
              horizontalScrollbarSize: 7,
              verticalSliderSize: 7,
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            renderWhitespace: "selection",
          }}
        />
      </div>

      {/* Footer shortcut bar */}
      <div className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-[#16161a] px-3 text-[11px] text-neutral-500 select-none">
        <div className="flex items-center gap-2">
          <span>Run: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘ / Ctrl + '</kbd></span>
          <span>•</span>
          <span>Submit: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘ / Ctrl + ↵</kbd></span>
        </div>
        <span>Tab to indent</span>
      </div>
    </div>
  );
}