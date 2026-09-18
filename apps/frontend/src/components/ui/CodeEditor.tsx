import React, { useRef } from "react";
import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import { Copy, RotateCcw, Check } from "lucide-react";
import { Button } from "./button";

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: string;
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
  onSubmit,
  onReset,
  disabled = false,
}: CodeEditorProps) {
  const [copied, setCopied] = React.useState(false);
  const editorRef = useRef<any>(null);

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

    // Define a custom dark theme inspired by One Dark Pro
    monaco.editor.defineTheme("leetcode-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D", fontStyle: "italic" },
        { token: "keyword", foreground: "C678DD" },
        { token: "string", foreground: "98C379" },
        { token: "number", foreground: "D19A66" },
        { token: "type", foreground: "E5C07B" },
        { token: "function", foreground: "61AFEF" },
        { token: "variable", foreground: "E06C75" },
        { token: "operator", foreground: "56B6C2" },
        { token: "delimiter", foreground: "ABB2BF" },
        { token: "identifier", foreground: "ABB2BF" },
      ],
      colors: {
        "editor.background": "#0f1117",
        "editor.foreground": "#ABB2BF",
        "editor.lineHighlightBackground": "#1a1d2e",
        "editor.selectionBackground": "#3E4451",
        "editorCursor.foreground": "#4653FF",
        "editorLineNumber.foreground": "#495162",
        "editorLineNumber.activeForeground": "#ABB2BF",
        "editor.selectionHighlightBackground": "#3E445180",
        "editorBracketMatch.background": "#3E445140",
        "editorBracketMatch.border": "#4653FF60",
        "editorIndentGuide.background": "#3B4048",
        "editorIndentGuide.activeBackground": "#5C6370",
        "editorGutter.background": "#0f1117",
        "scrollbarSlider.background": "#4E566680",
        "scrollbarSlider.hoverBackground": "#5A637580",
      },
    });

    monaco.editor.setTheme("leetcode-dark");

    // Focus the editor on mount
    editor.focus();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS environments
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

  return (
    <div className="flex flex-col h-full w-full rounded-xl border border-neutral-800 bg-[#0f1117] overflow-hidden shadow-inner font-mono text-sm">
      {/* Editor Header Bar */}
      <div className="flex h-10 items-center justify-between border-b border-neutral-800 bg-[#161922] px-4 select-none">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onReset && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onReset}
              title="Reset starter code"
              className="text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            title="Copy code"
            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={LANGUAGE_MAP[language] || "plaintext"}
          value={code}
          onChange={(value) => onChange(value ?? "")}
          onMount={handleEditorMount}
          theme="leetcode-dark"
          loading={
            <div className="flex h-full items-center justify-center text-neutral-500 text-xs">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-circuit border-t-transparent mr-2" />
              Loading editor...
            </div>
          }
          options={{
            fontSize: 14,
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
            padding: { top: 12, bottom: 12 },
            readOnly: disabled,
            domReadOnly: disabled,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              verticalSliderSize: 8,
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            renderWhitespace: "selection",
          }}
        />
      </div>

      {/* Footer shortcut bar */}
      <div className="flex h-7 items-center justify-between border-t border-neutral-800/80 bg-[#12141c] px-4 text-[11px] text-neutral-500 select-none">
        <span>Press <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">Tab</kbd> to indent</span>
        <span>Submit: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘ / Ctrl + Enter</kbd></span>
      </div>
    </div>
  );
}