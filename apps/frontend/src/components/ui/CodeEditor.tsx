import React, { useRef, useEffect } from "react";
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

export default function CodeEditor({
  code,
  onChange,
  language,
  onSubmit,
  onReset,
  disabled = false,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Sync scroll position between textarea and line number gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Handle keyboard shortcuts (Tab, Cmd/Ctrl + Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    // Tab key -> 4 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + "    " + code.substring(end);
      onChange(newCode);

      // Set cursor position after inserted tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }

    // Cmd + Enter or Ctrl + Enter -> Submit Code
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = Math.max(1, code.split("\n").length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

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

      {/* Editor Main Canvas with Line Numbers */}
      <div className="relative flex-1 flex overflow-hidden bg-[#0c0d12]">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-12 select-none overflow-hidden bg-[#12141c] py-3 pr-3 text-right text-xs text-neutral-600 border-r border-neutral-800/60 leading-6 font-mono"
        >
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Text Area Code Editor */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="// Write your solution code here..."
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 resize-none bg-transparent py-3 px-4 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 outline-none leading-6 caret-orange-500 selection:bg-orange-500/30 overflow-auto"
        />
      </div>

      {/* Footer shortcut bar */}
      <div className="flex h-7 items-center justify-between border-t border-neutral-800/80 bg-[#12141c] px-4 text-[11px] text-neutral-500 select-none">
        <span>Press <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">Tab</kbd> to indent</span>
        <span>Submit shortcut: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘ / Ctrl + Enter</kbd></span>
      </div>
    </div>
  );
}