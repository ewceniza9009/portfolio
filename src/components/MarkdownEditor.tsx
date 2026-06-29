import { useRef, useCallback, useEffect } from 'react'
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react'
import type { editor, languages } from 'monaco-editor'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  className?: string
  autoFocus?: boolean
  onEditorMount?: (editor: editor.IStandaloneCodeEditor) => void
  extraWords?: string[]
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

export default function MarkdownEditor({ value, onChange, height = '100%', className = '', autoFocus = false, onEditorMount, extraWords = [] }: MarkdownEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)

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
    <div className={`w-full ${className}`} style={{ height }}>
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