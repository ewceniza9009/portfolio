import { useRef, useCallback, useEffect } from 'react'
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react'
import type { editor, languages } from 'monaco-editor'
import { Bold, Italic, Code, Heading1, Heading2, List, ListOrdered, Link as LinkIcon, Quote, Image, Minus, Table, Box, Layers, HelpCircle, Puzzle } from 'lucide-react'
import { STEPS_SNIPPET, QUIZ_SNIPPET, getGenericSnippet, INTERACTIVE3D_SNIPPET, MERMAID_SNIPPET } from '../utils/snippets'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  className?: string
  autoFocus?: boolean
  onEditorMount?: (editor: editor.IStandaloneCodeEditor) => void
  extraWords?: string[]
  showToolbar?: boolean
}

const defineThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('portfolio-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0a0a0a',
      'editor.foreground': '#e5e5e5',
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.selectionBackground': '#ffffff15',
      'editorCursor.foreground': '#cca03d',
    },
  })
  monaco.editor.defineTheme('portfolio-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1a1a1a',
      'editor.lineHighlightBackground': '#00000005',
      'editor.selectionBackground': '#00000012',
      'editorCursor.foreground': '#b8860b',
    },
  })
}

function getTheme(): string {
  return document.documentElement.classList.contains('dark') ? 'portfolio-dark' : 'portfolio-light'
}

function registerCompletionProvider(monaco: typeof import('monaco-editor'), extraWords: string[] = []) {
  const provider: languages.CompletionItemProvider = {
    triggerCharacters: [' ', '#', '*', '-', '[', '`', '>', '|'],
    provideCompletionItems: (model, position) => {
      const wordBefore = model.getWordUntilPosition(position)
      const suggestions: languages.CompletionItem[] = []

      if (wordBefore.word.length >= 2) {
        const lower = wordBefore.word.toLowerCase()

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
              sortText: '0',
            })
          }
        }

        const markdownSnippets: Record<string, string> = {
          h1: '# ',
          h2: '## ',
          h3: '### ',
          bold: '**${1:text}**',
          italic: '*${1:text}*',
          code: '`${1:code}`',
          'code-block': '```\n${1:code}\n```',
          link: '[${1:text}](${2:url})',
          image: '![${1:alt}](${2:url})',
          quote: '> ',
          ul: '- ',
          ol: '1. ',
          hr: '\n---\n',
          table: '\n| Column | Column |\n|--------|--------|\n| Cell   | Cell   |\n',
          mermaid: MERMAID_SNIPPET,
          interactive: getGenericSnippet(),
          'interactive-3d': INTERACTIVE3D_SNIPPET,
        }

        for (const [key, snippet] of Object.entries(markdownSnippets)) {
          if (key.startsWith(lower) && key !== lower) {
            suggestions.push({
              label: key,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordBefore.startColumn,
                endColumn: wordBefore.endColumn,
              },
              sortText: '1',
            })
          }
        }
      }

      return { suggestions }
    },
  }

  monaco.languages.registerCompletionItemProvider('markdown', provider)
}

export default function MarkdownEditor({ value, onChange, height = '100%', className = '', autoFocus = false, onEditorMount, extraWords = [], showToolbar = false }: MarkdownEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)

  const insertAtCursor = useCallback((before: string, after = '', placeholder = '') => {
    const ed = editorRef.current
    if (!ed) return
    const selection = ed.getSelection()
    if (!selection) return
    const model = ed.getModel()
    if (!model) return
    const selectedText = model.getValueInRange(selection)
    const replacement = selectedText || placeholder
    const text = before + replacement + after
    ed.executeEdits('toolbar', [{ range: selection, text, forceMoveMarkers: true }])
    const newPos = {
      startLineNumber: selection.startLineNumber,
      startColumn: selection.startColumn + before.length,
      endLineNumber: selection.startLineNumber,
      endColumn: selection.startColumn + before.length + replacement.length,
    }
    ed.setSelection(newPos)
    ed.focus()
  }, [])

  const insertSnippet = useCallback((snippet: string) => {
    const ed = editorRef.current
    if (!ed) return
    const selection = ed.getSelection()
    if (!selection) return
    ed.executeEdits('toolbar', [{ range: selection, text: snippet, forceMoveMarkers: true }])
    ed.focus()
  }, [])

  const handleMount: OnMount = useCallback((editorInstance, monaco) => {
    editorRef.current = editorInstance
    monacoRef.current = monaco

    monaco.editor.setTheme(getTheme())
    registerCompletionProvider(monaco, extraWords)

    editorInstance.updateOptions({
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontLigatures: true,
      lineHeight: 22,
      padding: { top: 12, bottom: 12 },
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      wrappingStrategy: 'advanced',
      renderLineHighlight: 'line',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      quickSuggestions: false,
      tabSize: 2,
      automaticLayout: true,
      folding: true,
      showFoldingControls: 'always',
      foldingStrategy: 'auto',
      scrollbar: {
        verticalScrollbarSize: 6,
        horizontalScrollbarSize: 6,
        useShadows: false,
      },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
    })

    if (autoFocus) {
      editorInstance.focus()
    }

    onEditorMount?.(editorInstance)
  }, [autoFocus, onEditorMount, extraWords])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (monacoRef.current && editorRef.current) {
        monacoRef.current.editor.setTheme(getTheme())
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className={`w-full flex flex-col ${className}`} style={{ height }}>
      {showToolbar && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b shrink-0 flex-wrap" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <button onClick={() => insertAtCursor('**', '**', 'bold')} title="Bold" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Bold size={14} /></button>
          <button onClick={() => insertAtCursor('*', '*', 'italic')} title="Italic" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Italic size={14} /></button>
          <button onClick={() => insertAtCursor('`', '`', 'code')} title="Inline Code" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Code size={14} /></button>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <button onClick={() => insertAtCursor('# ', '', 'Heading')} title="H1" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Heading1 size={14} /></button>
          <button onClick={() => insertAtCursor('## ', '', 'Heading')} title="H2" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Heading2 size={14} /></button>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <button onClick={() => insertAtCursor('- ', '', 'list item')} title="Bullet List" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><List size={14} /></button>
          <button onClick={() => insertAtCursor('1. ', '', 'list item')} title="Numbered List" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><ListOrdered size={14} /></button>
          <button onClick={() => insertAtCursor('> ', '', 'quote')} title="Quote" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Quote size={14} /></button>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <button onClick={() => insertAtCursor('[', '](url)', 'link text')} title="Link" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><LinkIcon size={14} /></button>
          <button onClick={() => insertAtCursor('![alt](', ')', 'image url')} title="Image" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Image size={14} /></button>
          <button onClick={() => insertAtCursor('\n---\n', '', '')} title="Horizontal Rule" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Minus size={14} /></button>
          <button onClick={() => insertAtCursor('\n| Column | Column |\n|--------|--------|\n| Cell   | Cell   |\n', '', '')} title="Table" className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}><Table size={14} /></button>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <button onClick={() => insertSnippet(MERMAID_SNIPPET)} title="Insert Mermaid Diagram" className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
            <span className="hidden sm:inline">Mermaid</span>
          </button>
          <button onClick={() => insertSnippet(INTERACTIVE3D_SNIPPET)} title="Insert Interactive 3D Block" className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
            <Box size={14} />
            <span className="hidden sm:inline">3D Block</span>
          </button>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
          <button onClick={() => insertSnippet(STEPS_SNIPPET)} title="Insert Step-Through Tutorial" className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            <Layers size={14} />
            <span className="hidden sm:inline">Steps</span>
          </button>
          <button onClick={() => insertSnippet(QUIZ_SNIPPET)} title="Insert Interactive Quiz" className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            <HelpCircle size={14} />
            <span className="hidden sm:inline">Quiz</span>
          </button>
          <button onClick={() => insertSnippet(getGenericSnippet())} title="Insert Custom Interactive Block" className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            <Puzzle size={14} />
            <span className="hidden sm:inline">Interactive</span>
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Editor
          defaultLanguage="markdown"
          value={value}
          onChange={(v) => onChange(v || '')}
          onMount={handleMount}
          beforeMount={defineThemes}
          theme={getTheme()}
          loading={
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
              <span className="text-xs">Loading editor...</span>
            </div>
          }
          options={{
            wordWrap: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}

export function useMarkdownInsert() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const setEditor = useCallback((e: editor.IStandaloneCodeEditor | null) => {
    editorRef.current = e
  }, [])

  const insertMarkdown = useCallback((before: string, after = '', placeholder = '') => {
    const ed = editorRef.current
    if (!ed) return

    const selection = ed.getSelection()
    if (!selection) return

    const model = ed.getModel()
    if (!model) return

    const selectedText = model.getValueInRange(selection)
    const replacement = selectedText || placeholder
    const text = before + replacement + after

    ed.executeEdits('markdown-toolbar', [{
      range: selection,
      text,
      forceMoveMarkers: true,
    }])

    const newPos = {
      startLineNumber: selection.startLineNumber,
      startColumn: selection.startColumn + before.length,
      endLineNumber: selection.startLineNumber,
      endColumn: selection.startColumn + before.length + replacement.length,
    }
    ed.setSelection(newPos)
    ed.focus()
  }, [])

  return { editorRef, setEditor, insertMarkdown }
}
