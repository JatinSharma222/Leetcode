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

    // Define custom luxury theme inspired by Black Cherry and Cream Vanilla
    monaco.editor.defineTheme("atelier-burgundy", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "9E534E", fontStyle: "italic" },
        { token: "keyword", foreground: "E4C7A8", fontStyle: "bold" },
        { token: "string", foreground: "DFB58E" },
        { token: "number", foreground: "F5D6B6" },
        { token: "type", foreground: "F0E2D1", fontStyle: "italic" },
        { token: "function", foreground: "F9E9D8" },
        { token: "variable", foreground: "EEDCC8" },
        { token: "operator", foreground: "CDB296" },
        { token: "delimiter", foreground: "C5A586" },
        { token: "identifier", foreground: "EEDCC8" },
      ],
      colors: {
        "editor.background": "#460402",
        "editor.foreground": "#EEDCC8",
        "editor.lineHighlightBackground": "#56070380",
        "editor.selectionBackground": "#74100B",
        "editorCursor.foreground": "#EEDCC8",
        "editorLineNumber.foreground": "#8E332F",
        "editorLineNumber.activeForeground": "#EEDCC8",
        "editor.selectionHighlightBackground": "#74100B80",
        "editorBracketMatch.background": "#5D070360",
        "editorBracketMatch.border": "#EEDCC860",
        "editorIndentGuide.background": "#580905",
        "editorIndentGuide.activeBackground": "#7E140E",
        "editorGutter.background": "#3E0301",
        "scrollbarSlider.background": "#5D070380",
        "scrollbarSlider.hoverBackground": "#72100B",
      },
    });

    monaco.editor.setTheme("atelier-burgundy");
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
      className={`flex flex-col h-full w-full rounded-xl border border-border bg-[#460402] overflow-hidden shadow-[0_4px_16px_rgba(93,7,3,0.18)] font-mono text-sm ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
    >
      {/* Editor Header Bar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-[#3E0301] px-3 select-none">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#7A120D]" />
          <span className="h-2 w-2 rounded-full bg-[#9B6F30]" />
          <span className="h-2 w-2 rounded-full bg-[#8B7032]" />
          <span className="ml-2 font-display text-xs font-semibold tracking-wider text-[#EEDCC8] uppercase">
            Atelier Editor ({language})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={cycleFontSize}
            title={`Font size: ${fontSize}px (click to toggle)`}
            className="h-7 w-7 text-[#D8C1A8] hover:text-[#EEDCC8] hover:bg-[#5D0703] text-[11px]"
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
                className="h-7 w-7 text-[#D8C1A8] hover:text-[#EEDCC8] hover:bg-[#5D0703]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>

              {showConfirmReset && (
                <div className="absolute right-0 top-8 z-50 w-56 rounded-lg border border-border bg-[#3E0301] p-3 shadow-xl space-y-2.5 font-sans">
                  <p className="text-xs text-[#EEDCC8] font-medium">Reset code to default?</p>
                  <p className="text-[11px] text-[#C5A586]">Your current changes will be discarded.</p>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2 py-1 text-[11px] text-[#C5A586] hover:text-[#EEDCC8] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmReset(false);
                        onReset();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#7A120D] text-[#EEDCC8] border border-[#8C1813] rounded hover:bg-[#8C1813] cursor-pointer"
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
            className="h-7 w-7 text-[#D8C1A8] hover:text-[#EEDCC8] hover:bg-[#5D0703]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#DFB58E]" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="h-7 w-7 text-[#D8C1A8] hover:text-[#EEDCC8] hover:bg-[#5D0703]"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 overflow-hidden min-h-0 bg-[#460402]">
        <MonacoEditor
          height="100%"
          language={LANGUAGE_MAP[language] || "plaintext"}
          value={code}
          onChange={(value) => onChange(value ?? "")}
          onMount={handleEditorMount}
          theme="atelier-burgundy"
          loading={
            <div className="flex h-full items-center justify-center text-[#C5A586] text-xs">
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
      <div className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-[#3E0301] px-3 text-[11px] text-[#C5A586] select-none">
        <div className="flex items-center gap-2">
          <span>Run: <kbd className="rounded bg-[#5D0703] border border-[#6E0A05] px-1 py-0.5 text-[#EEDCC8]">⌘ / Ctrl + '</kbd></span>
          <span>•</span>
          <span>Submit: <kbd className="rounded bg-[#5D0703] border border-[#6E0A05] px-1 py-0.5 text-[#EEDCC8]">⌘ / Ctrl + ↵</kbd></span>
        </div>
        <span>Tab to indent</span>
      </div>
    </div>
  );
}