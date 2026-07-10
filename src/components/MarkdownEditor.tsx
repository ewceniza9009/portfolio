import { useRef, useCallback, useEffect, useState, memo } from "react";
import { createPortal } from "react-dom";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import type { editor, languages } from "monaco-editor";
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Image,
  Minus,
  Table,
  Box,
  Layers,
  HelpCircle,
  Puzzle,
  ChevronDown,
  Maximize2,
  BookOpen,
  X,
} from "lucide-react";
import {
  STEPS_SNIPPET,
  QUIZ_SNIPPET,
  getGenericSnippet,
  INTERACTIVE3D_SNIPPET,
  MERMAID_SNIPPET,
  CHART_SNIPPET,
  CODEHIKE_SNIPPET,
  REMOTION_SNIPPET,
  CODE_MORPH_SNIPPET,
} from "../utils/snippets";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  className?: string;
  autoFocus?: boolean;
  onEditorMount?: (editor: editor.IStandaloneCodeEditor) => void;
  extraWords?: string[];
  showToolbar?: boolean;
  hideLineNumbers?: boolean;
  renderInlinePreview?: (
    type: string,
    code: string,
    blockId: string,
  ) => React.ReactNode;
  onZoomBlock?: (block: {
    type: string;
    code: string;
    startLine: number;
    endLine: number;
  }) => void;
}

const defineThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("portfolio-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0a0a0a",
      "editor.foreground": "#e5e5e5",
      "editor.lineHighlightBackground": "#ffffff08",
      "editor.selectionBackground": "#ffffff15",
      "editorCursor.foreground": "#cca03d",
    },
  });
  monaco.editor.defineTheme("portfolio-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#1a1a1a",
      "editor.lineHighlightBackground": "#00000005",
      "editor.selectionBackground": "#00000012",
      "editorCursor.foreground": "#b8860b",
    },
  });
};

const getTheme = () => {
  if (typeof document !== "undefined") {
    // Check if the body or html has a light theme class or data attribute
    return document.documentElement.getAttribute("data-theme") === "light" ||
      document.body.classList.contains("light")
      ? "portfolio-light"
      : "portfolio-dark";
  }
  return "portfolio-dark";
};

let providersRegistered = false;

function registerCompletionProvider(
  monaco: typeof import("monaco-editor"),
  extraWords: string[] = [],
) {
  const provider: languages.CompletionItemProvider = {
    triggerCharacters: [" ", "#", "*", "-", "[", "`", ">", "|"],
    provideCompletionItems: (model, position) => {
      const wordBefore = model.getWordUntilPosition(position);
      const suggestions: languages.CompletionItem[] = [];

      if (wordBefore.word.length >= 2) {
        const lower = wordBefore.word.toLowerCase();

        for (const w of extraWords) {
          if (w.toLowerCase().startsWith(lower) && w.toLowerCase() !== lower) {
            suggestions.push({
              label: w,
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: w,
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordBefore.startColumn,
                endColumn: wordBefore.endColumn,
              },
              sortText: "0",
            });
          }
        }

        const markdownSnippets: Record<string, string> = {
          h1: "# ",
          h2: "## ",
          h3: "### ",
          bold: "**${1:text}**",
          italic: "*${1:text}*",
          code: "`${1:code}`",
          "code-block": "```\n${1:code}\n```",
          link: "[${1:text}](${2:url})",
          image: "![${1:alt}](${2:url})",
          quote: "> ",
          ul: "- ",
          ol: "1. ",
          hr: "\n---\n",
          table:
            "\n| Column | Column |\n|--------|--------|\n| Cell   | Cell   |\n",
          mermaid: MERMAID_SNIPPET,
          interactive: getGenericSnippet(),
          "interactive-3d": INTERACTIVE3D_SNIPPET,
          chart: CHART_SNIPPET,
          codehike: CODEHIKE_SNIPPET,
          remotion: REMOTION_SNIPPET,
          "code-morph": CODE_MORPH_SNIPPET,
        };

        for (const [key, snippet] of Object.entries(markdownSnippets)) {
          if (key.startsWith(lower) && key !== lower) {
            suggestions.push({
              label: key,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: snippet,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordBefore.startColumn,
                endColumn: wordBefore.endColumn,
              },
              sortText: "1",
            });
          }
        }
      }

      return { suggestions };
    },
  };

  monaco.languages.registerCompletionItemProvider("markdown", provider);
}

function registerFoldingProvider(monaco: typeof import("monaco-editor")) {
  monaco.languages.registerFoldingRangeProvider("markdown", {
    provideFoldingRanges: (model) => {
      const ranges: languages.FoldingRange[] = [];
      const lineCount = model.getLineCount();
      let startLine = -1;

      for (let i = 1; i <= lineCount; i++) {
        const lineContent = model.getLineContent(i);
        if (lineContent.startsWith("```")) {
          if (startLine === -1) {
            startLine = i;
          } else {
            ranges.push({
              start: startLine,
              end: i,
              kind: monaco.languages.FoldingRangeKind.Region,
            });
            startLine = -1;
          }
        }
      }
      return ranges;
    },
  });
}

let globalCommandRegistered = false;
function registerCodeLensProvider(monaco: typeof import("monaco-editor")) {
  // Command registration only once
  if (!globalCommandRegistered) {
    monaco.editor.registerCommand(
      "portfolio.previewBlock",
      (_accessor, args) => {
        window.dispatchEvent(
          new CustomEvent("portfolio.previewBlock", { detail: args }),
        );
      },
    );
    globalCommandRegistered = true;
  }

  monaco.languages.registerCodeLensProvider("markdown", {
    provideCodeLenses: (model) => {
      const lenses: languages.CodeLens[] = [];
      const lineCount = model.getLineCount();
      let currentBlockType = "";
      let currentBlockStart = -1;

      for (let i = 1; i <= lineCount; i++) {
        const lineContent = model.getLineContent(i);
        if (lineContent.startsWith("```")) {
          if (currentBlockStart === -1) {
            const type = lineContent.slice(3).trim().toLowerCase();
            if (
              [
                "interactive",
                "interactive-3d",
                "3d",
                "chart",
                "mermaid",
              ].includes(type)
            ) {
              currentBlockType = type;
              currentBlockStart = i;
            }
          } else {
            lenses.push({
              range: new monaco.Range(
                currentBlockStart,
                1,
                currentBlockStart,
                1,
              ),
              id: `preview-${currentBlockStart}`,
              command: {
                id: "portfolio.previewBlock",
                title: "👁️ Preview & Debug",
                arguments: [
                  {
                    uri: model.uri.toString(),
                    type: currentBlockType,
                    startLine: currentBlockStart,
                    endLine: i,
                  },
                ],
              },
            });
            currentBlockStart = -1;
            currentBlockType = "";
          }
        }
      }
      return { lenses, dispose: () => {} };
    },
    resolveCodeLens: (_model, codeLens) => codeLens,
  });
}

export default memo(function MarkdownEditor({
  value,
  onChange,
  height = "100%",
  className = "",
  autoFocus = false,
  onEditorMount,
  extraWords = [],
  showToolbar = false,
  hideLineNumbers = false,
  renderInlinePreview,
  onZoomBlock,
}: MarkdownEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chModalOpen, setChModalOpen] = useState(false);
  const [cmModalOpen, setCmModalOpen] = useState(false);
  const [previewWidgets, setPreviewWidgets] = useState<
    {
      id: string;
      widget: editor.IContentWidget;
      node: HTMLElement;
      type: string;
      code: string;
    }[]
  >([]);

  const handlePreviewBlockRef = useRef<(args: any) => void>(() => {});

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const insertAtCursor = useCallback(
    (before: string, after = "", placeholder = "") => {
      const ed = editorRef.current;
      if (!ed) return;
      const selection = ed.getSelection();
      if (!selection) return;
      const model = ed.getModel();
      if (!model) return;
      const selectedText = model.getValueInRange(selection);
      const replacement = selectedText || placeholder;
      const text = before + replacement + after;
      ed.executeEdits("toolbar", [
        { range: selection, text, forceMoveMarkers: true },
      ]);
      const newPos = {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn + before.length,
        endLineNumber: selection.startLineNumber,
        endColumn: selection.startColumn + before.length + replacement.length,
      };
      ed.setSelection(newPos);
      ed.focus();
    },
    [],
  );

  const insertSnippet = useCallback((snippet: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    const selection = ed.getSelection();
    if (!selection) return;
    ed.executeEdits("toolbar", [
      { range: selection, text: snippet, forceMoveMarkers: true },
    ]);
    ed.focus();
  }, []);

  const handlePreviewBlock = useCallback((args: any) => {
    const ed = editorRef.current;
    const mon = monacoRef.current;
    if (!ed || !mon) return;

    const { type, startLine, endLine } = args;
    const model = ed.getModel();
    if (!model) return;

    // Extract inner code
    const code = model.getValueInRange(
      new mon.Range(
        startLine + 1,
        1,
        endLine - 1,
        model.getLineMaxColumn(endLine - 1) || 1,
      ),
    );
    const blockId = `block-${startLine}-${endLine}`;

    setPreviewWidgets((prev) => {
      const existing = prev.find((vz) => vz.id === blockId);
      if (existing) {
        ed.removeContentWidget(existing.widget);
        return prev.filter((vz) => vz.id !== blockId);
      }

      const node = document.createElement("div");
      node.style.width = "550px";
      node.style.height = "400px";
      node.style.maxWidth = "90vw";
      node.style.zIndex = "100";
      node.style.pointerEvents = "auto";

      const widget: editor.IContentWidget = {
        getId: () => blockId,
        getDomNode: () => node,
        getPosition: () => ({
          position: { lineNumber: startLine, column: 1 },
          preference: [
            mon.editor.ContentWidgetPositionPreference.BELOW,
            mon.editor.ContentWidgetPositionPreference.EXACT,
          ],
        }),
      };

      ed.addContentWidget(widget);

      return [...prev, { id: blockId, widget, node, type, code }];
    });
  }, []);

  handlePreviewBlockRef.current = handlePreviewBlock;

  const handleMount: OnMount = useCallback(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance;
      monacoRef.current = monaco;

      monaco.editor.setTheme(getTheme());

      if (!providersRegistered) {
        registerCompletionProvider(monaco, extraWords);
        registerFoldingProvider(monaco);
        registerCodeLensProvider(monaco);
        providersRegistered = true;
      }

      editorInstance.updateOptions({
        fontSize: 13,
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        lineHeight: 22,
        padding: { top: 12, bottom: 12 },
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        wrappingStrategy: "advanced",
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        quickSuggestions: false,
        tabSize: 2,
        automaticLayout: true,
        folding: true,
        showFoldingControls: "always",
        foldingStrategy: "auto",
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
          useShadows: false,
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
      });

      if (autoFocus) {
        editorInstance.focus();
      }

      onEditorMount?.(editorInstance);
    },
    [autoFocus, onEditorMount, extraWords],
  );

  useEffect(() => {
    const handleThemeChange = () => {
      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(getTheme());
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Listen to global CodeLens command
    const handleGlobalPreviewCommand = (e: any) => {
      const args = e.detail;
      const model = editorRef.current?.getModel();
      if (model && model.uri.toString() === args.uri) {
        handlePreviewBlockRef.current(args);
      }
    };
    window.addEventListener(
      "portfolio.previewBlock",
      handleGlobalPreviewCommand,
    );

    return () => {
      observer.disconnect();
      window.removeEventListener(
        "portfolio.previewBlock",
        handleGlobalPreviewCommand,
      );
    };
  }, []);

  return (
    <div
      className={`w-full flex flex-col ${className}`}
      style={{ height: height || "100%" }}
    >
      {showToolbar && (
        <div
          className="flex items-center gap-0.5 px-2 py-1.5 border-b shrink-0 flex-wrap"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          <button
            onClick={() => insertAtCursor("**", "**", "bold")}
            title="Bold"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => insertAtCursor("*", "*", "italic")}
            title="Italic"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => insertAtCursor("`", "`", "code")}
            title="Inline Code"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Code size={14} />
          </button>
          <div
            className="w-px h-4 mx-1"
            style={{ background: "var(--border)" }}
          />
          <button
            onClick={() => insertAtCursor("# ", "", "Heading")}
            title="H1"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Heading1 size={14} />
          </button>
          <button
            onClick={() => insertAtCursor("## ", "", "Heading")}
            title="H2"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Heading2 size={14} />
          </button>
          <div
            className="w-px h-4 mx-1"
            style={{ background: "var(--border)" }}
          />
          <button
            onClick={() => insertAtCursor("- ", "", "list item")}
            title="Bullet List"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <List size={14} />
          </button>
          <button
            onClick={() => insertAtCursor("1. ", "", "list item")}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <ListOrdered size={14} />
          </button>
          <button
            onClick={() => insertAtCursor("> ", "", "quote")}
            title="Quote"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Quote size={14} />
          </button>
          <div
            className="w-px h-4 mx-1"
            style={{ background: "var(--border)" }}
          />
          <button
            onClick={() => insertAtCursor("[", "](url)", "link text")}
            title="Link"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <LinkIcon size={14} />
          </button>
          <button
            onClick={() => insertAtCursor("![alt](", ")", "image url")}
            title="Image"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Image size={14} />
          </button>
          <button
            onClick={() => insertAtCursor("\n---\n", "", "")}
            title="Horizontal Rule"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() =>
              insertAtCursor(
                "\n| Column | Column |\n|--------|--------|\n| Cell   | Cell   |\n",
                "",
                "",
              )
            }
            title="Table"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Table size={14} />
          </button>
          <div
            className="w-px h-4 mx-1"
            style={{ background: "var(--border)" }}
          />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title="Insert Block"
              className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold"
              style={{ color: "var(--text-secondary)" }}
            >
              <Puzzle size={14} />
              <span className="hidden sm:inline">Blocks</span>
              <ChevronDown size={10} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg border shadow-lg py-1"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
              >
                <button
                  onClick={() => {
                    insertSnippet(MERMAID_SNIPPET);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Mermaid Diagram
                </button>
                <button
                  onClick={() => {
                    insertSnippet(INTERACTIVE3D_SNIPPET);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  <Box size={12} />
                  3D Block
                </button>
                <div
                  className="my-1 border-t"
                  style={{ borderColor: "var(--border)" }}
                />
                <button
                  onClick={() => {
                    insertSnippet(STEPS_SNIPPET);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Layers size={12} />
                  Step-Through Tutorial
                </button>
                <button
                  onClick={() => {
                    insertSnippet(QUIZ_SNIPPET);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <HelpCircle size={12} />
                  Interactive Quiz
                </button>
                <button
                  onClick={() => {
                    insertSnippet(getGenericSnippet());
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Puzzle size={12} />
                  Custom Interactive
                </button>
                <div
                  className="my-1 border-t"
                  style={{ borderColor: "var(--border)" }}
                />
                <button
                  onClick={() => {
                    insertSnippet(CHART_SNIPPET);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Chart
                </button>
                <div
                  className="my-1 border-t"
                  style={{ borderColor: "var(--border)" }}
                />
                <button
                  onClick={() => {
                    insertSnippet(CODEHIKE_SNIPPET);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Code size={12} />
                  Code Hike Block
                </button>
                <button
                  onClick={() => {
                    insertSnippet(REMOTION_SNIPPET);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Remotion Video
                </button>
                <div
                  className="my-1 border-t"
                  style={{ borderColor: "var(--border)" }}
                />
                <button
                  onClick={() => {
                    insertSnippet(CODE_MORPH_SNIPPET);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                  Code Morph
                </button>
              </div>
            )}
          </div>
          {/* CodeHike Instructions Button */}
          <button
            onClick={() => setChModalOpen(true)}
            title="CodeHike Annotations Guide"
            className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold"
            style={{ color: "var(--accent)" }}
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">CH</span>
          </button>
          {/* Code Morph Instructions Button */}
          <button
            onClick={() => setCmModalOpen(true)}
            title="Code Morph Guide"
            className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold"
            style={{ color: "var(--accent)" }}
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">CM</span>
          </button>
        </div>
      )}

      {/* CodeHike Annotations Modal */}
      {chModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setChModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={18} style={{ color: "var(--accent)" }} />
                <h2
                  className="text-sm font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  CodeHike Annotations
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const all = `# CodeHike Annotations Reference

## Getting Started
\`\`\`codehike
// !focus
const x = "hello";
// !mark(green)
console.log(x);
\`\`\`

## Line Styles
\`\`\`codehike
// !border(red)
const server = "prod";
// !mark(green)
const status = "healthy";
// !bg(yellow)
const warning = "check logs";
// !focus
const critical = "pay attention";
// !highlight
const important = "note this";
\`\`\`

## Diff Annotations
\`\`\`codehike
function greet(name) {
  // !remove
  console.log("Hello " + name);
  // !add
  return \`Hello \${name}\`;
}
\`\`\`

## ClassName & Regex Targeting
\`\`\`codehike
function lorem(ipsum, dolor = 1) {
  // !classname line-through
  const sit = ipsum == null ? 0 : ipsum.sit
  dolor = sit - amet(dolor)
  // !classname[/sit/] bg-red-700 rounded-lg px-1
  return sit ? consectetur(ipsum) : []
}
\`\`\`

## Inline Annotations (Tooltip, Callout, Link, Footnote, Label)
\`\`\`codehike
import { useState } from "react" // !tooltip/useState/(React state hook)

// !callout(This function fetches user data)
async function getUser(id) {
  const res = await fetch(\`/api/users/\${id}\`) // !link(https://jsonplaceholder.typicode.com)
  return res.json() // !footnote(Returns a Promise with user object)
}

const [count, setCount] = useState(0) // !label[6:23](state variable)
\`\`\`

## Fold / Collapse
\`\`\`codehike
// !fold(start)
function processData(data) {
  const step1 = validate(data)
  const step2 = transform(step1)
  const step3 = optimize(step2)
  return step3
}
// !fold(end)

processData(rawInput)
\`\`\`

## Slideshow
\`\`\`codehike slideshow
// Step 1: Setup
const config = { host: "localhost", port: 3000 }
// ---
// Step 2: Connect
const conn = connect(config)
// ---
// Step 3: Fetch
const data = await conn.fetch("/api")
\`\`\`

## Style, Border Range & Mixed
\`\`\`codehike
// !border(start)
// !bg(purple)
const API_KEY = "sk-123"
const API_URL = "https://api.example.com"
// !border(end)

// !style(color: #22c55e; font-weight: bold)
const success = true

function connect() {
  // !callout[10:25](connection string)
  return fetch(API_URL)
}
\`\`\`

## Syntax Reference

### Line Styles
- \`// !border\` / \`// !border(blue)\` — Colored border box around line(s)
- \`// !mark\` / \`// !mark(green)\` — Background color + left border accent
- \`// !bg\` / \`// !bg(yellow)\` — Background color only (no left border)
- \`// !focus\` — Yellow border + glow, dims other lines
- \`// !highlight\` — Same as focus

### Diff
- \`// !add\` — Green left border + green tinted background
- \`// !remove\` — Red left border + red background + strikethrough
- \`// !diff(+)\` — Same as !add
- \`// !diff(-)\` — Same as !remove

### Multi-Line Ranges
- \`// !name(start)\` ... \`// !name(end)\` — Explicit range delimiters
- \`// !fold\` ... \`// !fold(end)\` — Collapse lines with fold chevron
- \`// !collapse\` ... \`// !collapse(end)\` — Same as fold
- \`// !wrap\` — Enables word wrapping on the block

### Inline Annotations
- \`// !callout(text)\` — Inline pill/tag next to text
- \`// !tooltip(text)\` — Hover popup with arrow pointer
- \`// !link(url)\` — Clickable underline link
- \`// !footnote(text)\` — Superscript [n] marker + hover popup
- \`// !label(text)\` — Floating pill above text
- \`// !style(css)\` — Apply inline CSS to the text
- \`// !classname(cls)\` — Apply CSS class to the text

### Regex Targeting
- \`// !tooltip/useState/(React hook)\` — Tooltip on "useState" text
- \`// !callout[10:20](highlight this)\` — Column range callout
- \`// !mark[5:15]\` — Mark columns 5-15
- \`// !classname[/sit/] bg-red-700\` — Highlight "sit" with CSS class

### Colors
red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose, white, gray
Plus any valid CSS color: #ff0000, rgb(...)

### Slideshow
Add \`slideshow\` to the code fence language. Separate steps with \`// ---\`.
`;
                    navigator.clipboard.writeText(all);
                  }}
                  className="px-2.5 py-1 rounded text-[10px] font-bold hover:bg-white/10 transition-colors flex items-center gap-1"
                  style={{ color: "var(--accent)" }}
                  title="Copy all examples"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy All
                </button>
                <button
                  onClick={() => setChModalOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto px-5 py-4 space-y-5 text-xs"
              style={{ color: "var(--text-primary)" }}
            >
              {/* ── Getting Started ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Getting Started
                </h3>
                <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                  Wrap your code in a{" "}
                  <code
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--accent)",
                    }}
                  >
                    {"```codehike"}
                  </code>{" "}
                  fence. Add annotations as{" "}
                  <code
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    // !name
                  </code>{" "}
                  comments on their own line or after code.
                </p>
                <div
                  className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        '```codehike\n// !focus\nconst x = "hello";\n// !mark(green)\nconsole.log(x);\n```',
                      )
                    }
                    className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                    title="Copy"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  <div>{"```codehike"}</div>
                  <div style={{ color: "var(--text-muted)" }}>// !focus</div>
                  <div>const x = "hello";</div>
                  <div style={{ color: "var(--text-muted)" }}>
                    // !mark(green)
                  </div>
                  <div>console.log(x);</div>
                  <div>{"```"}</div>
                </div>
              </section>

              {/* ── Live Examples ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Live Examples
                </h3>
                <p className="mb-3" style={{ color: "var(--text-secondary)" }}>
                  Copy-paste these into a{" "}
                  <code
                    className="px-1 py-0.5 rounded text-[11px] font-mono"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    {"```codehike"}
                  </code>{" "}
                  block to see them in action.
                </p>

                {/* Example 1: Line Styles */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Line Styles
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          '```codehike\n// !border(red)\nconst server = "prod";\n// !mark(green)\nconst status = "healthy";\n// !bg(yellow)\nconst warning = "check logs";\n// !focus\nconst critical = "pay attention";\n// !highlight\nconst important = "note this";\n```',
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```codehike"}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !border(red)
                    </div>
                    <div>const server = "prod";</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !mark(green)
                    </div>
                    <div>const status = "healthy";</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !bg(yellow)
                    </div>
                    <div>const warning = "check logs";</div>
                    <div style={{ color: "var(--text-muted)" }}>// !focus</div>
                    <div>const critical = "pay attention";</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !highlight
                    </div>
                    <div>const important = "note this";</div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 2: Diff */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Diff Annotations
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          '```codehike\nfunction greet(name) {\n  // !remove\n  console.log("Hello " + name);\n  // !add\n  return `Hello ${name}`;\n}\n```',
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```codehike"}</div>
                    <div>function greet(name) {"{"}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      {" "}
                      // !remove
                    </div>
                    <div> console.log("Hello " + name);</div>
                    <div style={{ color: "var(--text-muted)" }}> // !add</div>
                    <div> return `Hello {"${name}"}`;</div>
                    <div>{"}"}</div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 3: ClassName with Regex */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ClassName &amp; Regex Targeting
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          "```codehike\nfunction lorem(ipsum, dolor = 1) {\n  // !classname line-through\n  const sit = ipsum == null ? 0 : ipsum.sit\n  dolor = sit - amet(dolor)\n  // !classname[/sit/] bg-red-700 rounded-lg px-1\n  return sit ? consectetur(ipsum) : []\n}\n```",
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```codehike"}</div>
                    <div>function lorem(ipsum, dolor = 1) {"{"}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      {" "}
                      // !classname line-through
                    </div>
                    <div> const sit = ipsum == null ? 0 : ipsum.sit</div>
                    <div> dolor = sit - amet(dolor)</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      {" "}
                      // !classname{"[/sit/]"} bg-red-700 rounded-lg px-1
                    </div>
                    <div> return sit ? consectetur(ipsum) : []</div>
                    <div>{"}"}</div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 4: Inline Annotations */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Inline Annotations (Tooltip, Callout, Link, Footnote)
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          '```codehike\nimport { useState } from "react" // !tooltip/useState/(React state hook)\n\n// !callout(This function fetches user data)\nasync function getUser(id) {\n  const res = await fetch(`/api/users/${id}`) // !link(https://jsonplaceholder.typicode.com)\n  return res.json() // !footnote(Returns a Promise with user object)\n}\n\nconst [count, setCount] = useState(0) // !label[6:23](state variable)\n```',
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```codehike"}</div>
                    <div>
                      import {"{"} useState {"}"} from "react"{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        // !tooltip/useState/(React state hook)
                      </span>
                    </div>
                    <div></div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !callout(This function fetches user data)
                    </div>
                    <div>async function getUser(id) {"{"}</div>
                    <div>
                      {" "}
                      const res = await fetch(`/api/users/${"${id}"}`){" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        // !link(https://jsonplaceholder.typicode.com)
                      </span>
                    </div>
                    <div>
                      {" "}
                      return res.json(){" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        // !footnote(Returns a Promise with user object)
                      </span>
                    </div>
                    <div>{"}"}</div>
                    <div></div>
                    <div>
                      const [count, setCount] = useState(0){" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        // !label{"[6:23]"}(state variable)
                      </span>
                    </div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 5: Fold/Collapse */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Fold / Collapse
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          "```codehike\n// !fold(start)\nfunction processData(data) {\n  const step1 = validate(data)\n  const step2 = transform(step1)\n  const step3 = optimize(step2)\n  return step3\n}\n// !fold(end)\n\nprocessData(rawInput)\n```",
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```codehike"}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !fold(start)
                    </div>
                    <div>function processData(data) {"{"}</div>
                    <div> const step1 = validate(data)</div>
                    <div> const step2 = transform(step1)</div>
                    <div> const step3 = optimize(step2)</div>
                    <div> return step3</div>
                    <div>{"}"}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !fold(end)
                    </div>
                    <div></div>
                    <div>processData(rawInput)</div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 6: Slideshow */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Slideshow
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          '```codehike slideshow\n// Step 1: Setup\nconst config = { host: "localhost", port: 3000 }\n// ---\n// Step 2: Connect\nconst conn = connect(config)\n// ---\n// Step 3: Fetch\nconst data = await conn.fetch("/api")\n```',
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```codehike slideshow"}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // Step 1: Setup
                    </div>
                    <div>
                      const config = {"{"} host: "localhost", port: 3000 {"}"}
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>// ---</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // Step 2: Connect
                    </div>
                    <div>const conn = connect(config)</div>
                    <div style={{ color: "var(--text-muted)" }}>// ---</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // Step 3: Fetch
                    </div>
                    <div>const data = await conn.fetch("/api")</div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 7: Style & Border Range */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Style, Border Range &amp; Mixed
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          '```codehike\n// !border(start)\n// !bg(purple)\nconst API_KEY = "sk-123"\nconst API_URL = "https://api.example.com"\n// !border(end)\n\n// !style(color: #22c55e; font-weight: bold)\nconst success = true\n\nfunction connect() {\n  // !callout[10:25](connection string)\n  return fetch(API_URL)\n}\n```',
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```codehike"}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !border(start)
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !bg(purple)
                    </div>
                    <div>const API_KEY = "sk-123"</div>
                    <div>const API_URL = "https://api.example.com"</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !border(end)
                    </div>
                    <div></div>
                    <div style={{ color: "var(--text-muted)" }}>
                      // !style(color: #22c55e; font-weight: bold)
                    </div>
                    <div>const success = true</div>
                    <div></div>
                    <div>function connect() {"{"}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      {" "}
                      // !callout{"[10:25]"}(connection string)
                    </div>
                    <div> return fetch(API_URL)</div>
                    <div>{"}"}</div>
                    <div>{"```"}</div>
                  </div>
                </div>
              </section>

              {/* ── Line Styles ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Line Styles
                </h3>
                <div className="space-y-1.5">
                  {[
                    [
                      "// !border",
                      "// !border(blue)",
                      "Colored border box around line(s)",
                    ],
                    [
                      "// !mark",
                      "// !mark(green)",
                      "Background color + left border accent",
                    ],
                    [
                      "// !bg",
                      "// !bg(yellow)",
                      "Background color only (no left border)",
                    ],
                    ["// !focus", "", "Yellow border + glow, dims other lines"],
                    [
                      "// !highlight",
                      "",
                      "Same as focus — yellow border + dim",
                    ],
                  ].map(([simple, color, desc]) => (
                    <div
                      key={simple}
                      className="flex items-start gap-3 p-2 rounded"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <code className="shrink-0 font-mono text-[11px]">
                        {simple}
                      </code>
                      {color && (
                        <code className="shrink-0 font-mono text-[11px] opacity-60">
                          {color}
                        </code>
                      )}
                      <span className="opacity-60">{desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Diff ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Diff Annotations
                </h3>
                <div className="space-y-1.5">
                  {[
                    ["// !add", "Green left border + green tinted background"],
                    [
                      "// !remove",
                      "Red left border + red background + strikethrough",
                    ],
                    ["// !diff(+)", "Same as !add"],
                    ["// !diff(-)", "Same as !remove"],
                  ].map(([syntax, desc]) => (
                    <div
                      key={syntax}
                      className="flex items-start gap-3 p-2 rounded"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <code className="shrink-0 font-mono text-[11px]">
                        {syntax}
                      </code>
                      <span className="opacity-60">{desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Ranges ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Multi-Line Ranges
                </h3>
                <div className="space-y-1.5">
                  {[
                    [
                      "// !name(start) ... // !name(end)",
                      "Explicit range delimiters",
                    ],
                    [
                      "// !fold ... // !fold(end)",
                      "Collapse lines with fold chevron",
                    ],
                    ["// !collapse ... // !collapse(end)", "Same as fold"],
                    ["// !wrap", "Enables word wrapping on the block"],
                  ].map(([syntax, desc]) => (
                    <div
                      key={syntax}
                      className="flex items-start gap-3 p-2 rounded"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <code className="shrink-0 font-mono text-[11px]">
                        {syntax}
                      </code>
                      <span className="opacity-60">{desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Inline Annotations ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Inline Annotations
                </h3>
                <div className="space-y-1.5">
                  {[
                    ["// !callout(text)", "Inline pill/tag next to text"],
                    ["// !tooltip(text)", "Hover popup with arrow pointer"],
                    ["// !link(url)", "Clickable underline link"],
                    [
                      "// !footnote(text)",
                      "Superscript [n] marker + hover popup",
                    ],
                    ["// !label(text)", "Floating pill above text"],
                    ["// !style(css)", "Apply inline CSS to the text"],
                    ["// !classname(cls)", "Apply CSS class to the text"],
                  ].map(([syntax, desc]) => (
                    <div
                      key={syntax}
                      className="flex items-start gap-3 p-2 rounded"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <code className="shrink-0 font-mono text-[11px]">
                        {syntax}
                      </code>
                      <span className="opacity-60">{desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Regex Targeting ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Regex Targeting
                </h3>
                <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                  Target specific text matching a regex. Use{" "}
                  <code
                    className="px-1 py-0.5 rounded text-[11px] font-mono"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    /regex/
                  </code>{" "}
                  or{" "}
                  <code
                    className="px-1 py-0.5 rounded text-[11px] font-mono"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    {"[/regex/]"}
                  </code>{" "}
                  syntax.
                </p>
                <div className="space-y-1.5">
                  {[
                    [
                      "// !tooltip/useState/(React hook)",
                      "Tooltip on 'useState' text",
                    ],
                    [
                      "// !callout[10:20](highlight this)",
                      "Column range callout",
                    ],
                    ["// !mark[5:15]", "Mark columns 5-15"],
                    [
                      "// !classname[/sit/] bg-red-700",
                      "Highlight 'sit' with CSS class",
                    ],
                  ].map(([syntax, desc]) => (
                    <div
                      key={syntax}
                      className="flex items-start gap-3 p-2 rounded"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <code className="shrink-0 font-mono text-[11px]">
                        {syntax}
                      </code>
                      <span className="opacity-60">{desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Colors ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Colors
                </h3>
                <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                  Use named colors or any CSS color value.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "red",
                    "orange",
                    "amber",
                    "yellow",
                    "lime",
                    "green",
                    "emerald",
                    "teal",
                    "cyan",
                    "sky",
                    "blue",
                    "indigo",
                    "violet",
                    "purple",
                    "fuchsia",
                    "pink",
                    "rose",
                    "white",
                    "gray",
                  ].map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded text-[10px] font-mono"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      {c}
                    </span>
                  ))}
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono opacity-60"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    #ff0000, rgb(...)
                  </span>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div
              className="px-5 py-3 border-t shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={() => setChModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "var(--accent)", color: document.documentElement.getAttribute('data-theme') === 'light' ? '#fff' : '#000' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      {cmModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setCmModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
                <h2
                  className="text-sm font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Code Morph Guide
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const all = `# Code Morph Examples

## Basic Refactor (JS)
\`\`\`code-morph
function greet(name) {
  return "Hello, " + name;
}
---
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## TypeScript Type Migration
\`\`\`code-morph
function getData(id) {
  return fetch("/api/" + id).then(r => r.json());
}
---
async function getData(id: string): Promise<Data> {
  const res = await fetch(\`/api/\${id}\`);
  return res.json();
}
\`\`\`

## CSS to Tailwind
\`\`\`code-morph
.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
---
<div className="bg-white rounded-lg p-4 shadow-md">
\`\`\`

## Python Refactor
\`\`\`code-morph
def process(data):
    result = []
    for item in data:
        result.append(item * 2)
    return result
---
def process(data):
    return [item * 2 for item in data]
\`\`\``;
                    navigator.clipboard.writeText(all);
                  }}
                  className="px-2.5 py-1 rounded text-[10px] font-bold hover:bg-white/10 transition-colors flex items-center gap-1"
                  style={{ color: "var(--accent)" }}
                  title="Copy all examples"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy All
                </button>
                <button
                  onClick={() => setCmModalOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto px-5 py-4 space-y-5 text-xs"
              style={{ color: "var(--text-primary)" }}
            >
              {/* ── Getting Started ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Getting Started
                </h3>
                <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                  Wrap your code in a{" "}
                  <code
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--accent)",
                    }}
                  >
                    {"```code-morph"}
                  </code>{" "}
                  fence. Use <code className="px-1.5 py-0.5 rounded text-[11px] font-mono" style={{ background: "var(--bg-secondary)" }}>---</code> on its own line to separate the "before" (top) and "after" (bottom) code. Click the Play button to morph between them.
                </p>
                <div
                  className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        '```code-morph\nconst name = "World";\nconsole.log(name);\n---\nconst greeting = "Hello, World!";\nconsole.log(greeting);\n```',
                      )
                    }
                    className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                    title="Copy"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  <div>{"```code-morph"}</div>
                  <div>const name = "World";</div>
                  <div>console.log(name);</div>
                  <div style={{ color: "var(--text-muted)" }}>---</div>
                  <div>const greeting = "Hello, World!";</div>
                  <div>console.log(greeting);</div>
                  <div>{"```"}</div>
                </div>
              </section>

              {/* ── Animation Modes ── */}
              <section className="mb-5">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Animation Modes
                </h3>
                <p className="mb-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  Append a mode after <code className="px-1 py-0.5 rounded font-mono" style={{ background: "var(--bg-secondary)" }}>code-morph</code> in the fence opener. Modes with a HyperFrames badge match the real code-animation engine:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded" style={{ background: "var(--bg-secondary)" }}>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>morph</span>
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>Key-based FLIP glide <span className="italic">(default, HyperFrames)</span></span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{"```code-morph morph"}</span>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-secondary)" }}>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>diff</span>
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>Line-level LCS diff, collapse/expand <span className="italic">(HyperFrames)</span></span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{"```code-morph diff"}</span>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-secondary)" }}>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>flight</span>
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>Line blocks fly in staggered <span className="italic">(HyperFrames)</span></span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{"```code-morph flight"}</span>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-secondary)" }}>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>typewriter</span>
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>Per-character reveal + gliding caret <span className="italic">(HyperFrames)</span></span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{"```code-morph typewriter"}</span>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-secondary)" }}>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>highlight</span>
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>Highlight middle line, dim others <span className="italic">(HyperFrames)</span></span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{"```code-morph highlight"}</span>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-secondary)" }}>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>scroll</span>
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>Scroll to center line + highlight <span className="italic">(HyperFrames)</span></span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{"```code-morph scroll"}</span>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-secondary)" }}>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>fade</span>
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>Cross-fade with slight vertical offset</span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{"```code-morph fade"}</span>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-secondary)" }}>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>flip</span>
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>3D card flip with perspective</span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{"```code-morph flip"}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-4">
                  <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Examples:</p>

                  {/* Morph */}
                  <div className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed" style={{ background: "var(--bg-secondary)" }}>
                    <button onClick={() => navigator.clipboard.writeText('```code-morph morph\nlet x = 1;\nlet y = 2;\n---\nconst x = 1;\nconst y = 2;\n```')} className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]" style={{ color: "var(--text-muted)" }} title="Copy">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    </button>
                    <div className="text-[10px] text-gray-500 mb-1">morph — key-based FLIP (tokens glide)</div>
                    <div>{"```code-morph morph"}</div>
                    <div>let x = 1;</div>
                    <div>let y = 2;</div>
                    <div style={{ color: "var(--text-muted)" }}>---</div>
                    <div>const x = 1;</div>
                    <div>const y = 2;</div>
                    <div>{"```"}</div>
                  </div>

                  {/* Diff */}
                  <div className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed" style={{ background: "var(--bg-secondary)" }}>
                    <button onClick={() => navigator.clipboard.writeText('```code-morph diff\nconst a = 1;\nconst b = 2;\n---\nconst a = 1;\nconst c = 3;\n```')} className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]" style={{ color: "var(--text-muted)" }} title="Copy">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    </button>
                    <div className="text-[10px] text-gray-500 mb-1">diff — line-level LCS, red lines collapse, green lines expand</div>
                    <div>{"```code-morph diff"}</div>
                    <div>const a = 1;</div>
                    <div>const b = 2;</div>
                    <div style={{ color: "var(--text-muted)" }}>---</div>
                    <div>const a = 1;</div>
                    <div>const c = 3;</div>
                    <div>{"```"}</div>
                  </div>

                  {/* Flight */}
                  <div className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed" style={{ background: "var(--bg-secondary)" }}>
                    <button onClick={() => navigator.clipboard.writeText('```code-morph flight\nconsole.log("a");\n---\nconsole.log("a");\nconsole.log("b");\n```')} className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]" style={{ color: "var(--text-muted)" }} title="Copy">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    </button>
                    <div className="text-[10px] text-gray-500 mb-1">flight — line blocks fly in from left with stagger</div>
                    <div>{"```code-morph flight"}</div>
                    <div>console.log("a");</div>
                    <div style={{ color: "var(--text-muted)" }}>---</div>
                    <div>console.log("a");</div>
                    <div>console.log("b");</div>
                    <div>{"```"}</div>
                  </div>

                  {/* Typewriter */}
                  <div className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed" style={{ background: "var(--bg-secondary)" }}>
                    <button onClick={() => navigator.clipboard.writeText('```code-morph typewriter\nHello World\n---\nHello Folks\n```')} className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]" style={{ color: "var(--text-muted)" }} title="Copy">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    </button>
                    <div className="text-[10px] text-gray-500 mb-1">typewriter — per-character reveal + gliding caret</div>
                    <div>{"```code-morph typewriter"}</div>
                    <div>Hello World</div>
                    <div style={{ color: "var(--text-muted)" }}>---</div>
                    <div>Hello Folks</div>
                    <div>{"```"}</div>
                  </div>
                </div>
              </section>

              {/* ── Live Examples ── */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Live Examples
                </h3>
                <p className="mb-3" style={{ color: "var(--text-secondary)" }}>
                  Copy-paste these into a{" "}
                  <code
                    className="px-1 py-0.5 rounded text-[11px] font-mono"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    {"```code-morph"}
                  </code>{" "}
                  block to show code transformations.
                </p>

                {/* Example 1: JS Refactor (morph) */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    JavaScript Refactor (morph)
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          '```code-morph morph\nfunction greet(name) {\n  return "Hello, " + name;\n}\n---\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```',
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```code-morph morph"}</div>
                    <div>function greet(name) {"{"}</div>
                    <div>{"  return \"Hello, \" + name;"}</div>
                    <div>{"}"}</div>
                    <div style={{ color: "var(--text-muted)" }}>---</div>
                    <div>function greet(name) {"{"}</div>
                    <div>{"  return `Hello, ${name}!`;"}</div>
                    <div>{"}"}</div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 2: TypeScript Migration (fade) */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    TypeScript Migration
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          "```code-morph fade\nfunction getData(id) {\n  return fetch(\"/api/\" + id).then(r => r.json());\n}\n---\nasync function getData(id: string): Promise<Data> {\n  const res = await fetch(`/api/${id}`);\n  return res.json();\n}\n```",
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```code-morph fade"}</div>
                    <div>function getData(id) {"{"}</div>
                    <div>{"  return fetch(\"/api/\" + id).then(r => r.json());"}</div>
                    <div>{"}"}</div>
                    <div style={{ color: "var(--text-muted)" }}>---</div>
                    <div>async function getData(id: string): {"Promise<Data> {"}</div>
                    <div>{"  const res = await fetch(`/api/${id}`);"}</div>
                    <div>{"  return res.json();"}</div>
                    <div>{"}"}</div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 3: CSS to Tailwind (flip) */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    CSS to Tailwind
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          '```code-morph flip\n.card {\n  background: white;\n  border-radius: 8px;\n  padding: 16px;\n  box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n}\n---\n<div className="bg-white rounded-lg p-4 shadow-md">\n  {/* content */}\n</div>\n```',
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```code-morph flip"}</div>
                    <div>.card {"{"}</div>
                    <div>{"  background: white;"}</div>
                    <div>{"  border-radius: 8px;"}</div>
                    <div>{"  padding: 16px;"}</div>
                    <div>{"  box-shadow: 0 2px 8px rgba(0,0,0,0.1);"}</div>
                    <div>{"}"}</div>
                    <div style={{ color: "var(--text-muted)" }}>---</div>
                    <div>{"<div className=\"bg-white rounded-lg p-4 shadow-md\">"}</div>
                    <div>{"  {/* content */}"}</div>
                    <div>{"</div>"}</div>
                    <div>{"```"}</div>
                  </div>
                </div>

                {/* Example 4: Python Refactor (diff) */}
                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Python Refactor (diff mode)
                  </p>
                  <div
                    className="relative p-3 rounded-lg font-mono text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          '```code-morph diff\ndef process(data):\n    result = []\n    for item in data:\n        result.append(item * 2)\n    return result\n---\ndef process(data):\n    return [item * 2 for item in data]\n```',
                        )
                      }
                      className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                      title="Copy"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <div>{"```code-morph diff"}</div>
                    <div>def process(data):</div>
                    <div>{"    result = []"}</div>
                    <div>{"    for item in data:"}</div>
                    <div>{"        result.append(item * 2)"}</div>
                    <div>{"    return result"}</div>
                    <div style={{ color: "var(--text-muted)" }}>---</div>
                    <div>def process(data):</div>
                    <div>{"    return [item * 2 for item in data]"}</div>
                    <div>{"```"}</div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div
              className="px-5 py-3 border-t shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={() => setCmModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "var(--accent)", color: document.documentElement.getAttribute('data-theme') === 'light' ? '#fff' : '#000' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 h-full w-full">
        <Editor
          defaultLanguage="markdown"
          value={value}
          onChange={(v) => onChange(v || "")}
          onMount={handleMount}
          beforeMount={defineThemes}
          theme={getTheme()}
          loading={
            <div
              className="flex items-center justify-center h-full"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="text-xs">Loading editor...</span>
            </div>
          }
          options={{
            wordWrap: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            ...(hideLineNumbers
              ? {
                  lineNumbers: "off",
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                }
              : {}),
          }}
        />
      </div>

      {previewWidgets.map((vz) =>
        createPortal(
          <div className="w-full h-full border border-[var(--accent)] bg-[var(--bg-card)] rounded-xl overflow-hidden relative shadow-2xl pointer-events-auto">
            <div className="absolute top-2 right-2 z-50 flex items-center gap-2">
              {onZoomBlock && (
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onZoomBlock({
                      type: vz.type,
                      code: vz.code,
                      startLine: parseInt(vz.id?.split("-")[1] || "0"),
                      endLine: parseInt(vz.id?.split("-")[2] || "0"),
                    });
                  }}
                  className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                  title="Zoom (Isolate Block)"
                >
                  <Maximize2 size={14} />
                </button>
              )}
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePreviewBlockRef.current({
                    type: vz.type,
                    startLine: parseInt(vz.id?.split("-")[1] || "0"),
                    endLine: parseInt(vz.id?.split("-")[2] || "0"),
                  });
                }}
                className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Close Preview"
              >
                <Minus size={14} />
              </button>
            </div>
            <div className="absolute top-2 left-2 z-50 px-2 py-1 bg-[var(--accent-dim)] text-[var(--accent)] text-[10px] font-bold uppercase rounded-md border border-[var(--accent)] shadow">
              {vz.type} Preview
            </div>
            <div className="w-full h-full pt-10">
              {renderInlinePreview
                ? renderInlinePreview(vz.type, vz.code, vz.id)
                : null}
            </div>
          </div>,
          vz.node,
        ),
      )}
    </div>
  );
});

export function useMarkdownInsert() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const setEditor = useCallback((e: editor.IStandaloneCodeEditor | null) => {
    editorRef.current = e;
  }, []);

  const insertMarkdown = useCallback(
    (before: string, after = "", placeholder = "") => {
      const ed = editorRef.current;
      if (!ed) return;

      const selection = ed.getSelection();
      if (!selection) return;

      const model = ed.getModel();
      if (!model) return;

      const selectedText = model.getValueInRange(selection);
      const replacement = selectedText || placeholder;
      const text = before + replacement + after;

      ed.executeEdits("markdown-toolbar", [
        {
          range: selection,
          text,
          forceMoveMarkers: true,
        },
      ]);

      const newPos = {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn + before.length,
        endLineNumber: selection.startLineNumber,
        endColumn: selection.startColumn + before.length + replacement.length,
      };
      ed.setSelection(newPos);
      ed.focus();
    },
    [],
  );

  return { editorRef, setEditor, insertMarkdown };
}
