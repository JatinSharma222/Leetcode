import type { Monaco } from "@monaco-editor/react";

export const OBSIDIAN_THEME = "obsidian-precision";

export function defineObsidianTheme(monaco: Monaco) {
  monaco.editor.defineTheme(OBSIDIAN_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7D8597", fontStyle: "italic" },
      { token: "keyword", foreground: "FB7185", fontStyle: "bold" },
      { token: "string", foreground: "34D399" },
      { token: "number", foreground: "A78BFA" },
      { token: "type", foreground: "38BDF8" },
      { token: "function", foreground: "60A5FA" },
      { token: "variable", foreground: "F9FAFB" },
      { token: "operator", foreground: "FB7185" },
      { token: "delimiter", foreground: "9CA3AF" },
      { token: "identifier", foreground: "F9FAFB" },
    ],
    colors: {
      "editor.background": "#0B0B0F",
      "editor.foreground": "#F9FAFB",
      "editor.lineHighlightBackground": "#16161F",
      "editor.selectionBackground": "#D91E4540",
      "editorCursor.foreground": "#D91E45",
      "editorLineNumber.foreground": "#4B5563",
      "editorLineNumber.activeForeground": "#F9FAFB",
      "editor.selectionHighlightBackground": "#FFFFFF14",
      "editorBracketMatch.background": "#D91E4530",
      "editorBracketMatch.border": "#D91E4580",
      "editorIndentGuide.background": "#1F1F28",
      "editorIndentGuide.activeBackground": "#374151",
      "editorGutter.background": "#0E0E12",
      "scrollbarSlider.background": "#FFFFFF15",
      "scrollbarSlider.hoverBackground": "#FFFFFF25",
    },
  });
}
