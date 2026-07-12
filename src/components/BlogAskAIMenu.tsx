import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Sparkles, Copy, Check } from "lucide-react"

interface MenuState {
  x: number
  y: number
  below: boolean
  text: string
}

/**
 * Floating "Ask AI about this" menu that appears when the reader selects text
 * (or right-clicks a selection) anywhere inside the referenced blog article.
 * Selecting dispatches the global `open-ai-chat` window event consumed by
 * FloatingControl, which opens the AI chat prefilled with the selection.
 */
export default function BlogAskAIMenu({
  containerRef,
  blogTitle,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  blogTitle: string
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const getSelectionInfo = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) return null
      const text = sel.toString().trim()
      if (!text) return null
      const range = sel.getRangeAt(0)
      const container = containerRef.current
      if (!container || !container.contains(range.commonAncestorContainer))
        return null
      return { text, rect: range.getBoundingClientRect() }
    }

    const place = (text: string, rect: DOMRect) => {
      const x = Math.min(
        Math.max(rect.left + rect.width / 2, 12),
        window.innerWidth - 12,
      )
      const above = rect.top > 70
      const y = above ? rect.top - 10 : rect.bottom + 10
      setMenu({ x, y, below: !above, text })
    }

    const onMouseUp = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      // Defer so the browser finalizes the selection before we read it.
      setTimeout(() => {
        const info = getSelectionInfo()
        if (info) place(info.text, info.rect)
        else setMenu(null)
      }, 0)
    }

    const onMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(null)
    }

    const onContextMenu = (e: MouseEvent) => {
      const info = getSelectionInfo()
      if (!info) {
        setMenu(null)
        return
      }
      e.preventDefault()
      place(info.text, info.rect)
    }

    const hide = () => setMenu(null)

    document.addEventListener("mouseup", onMouseUp)
    document.addEventListener("mousedown", onMouseDown)
    containerRef.current?.addEventListener("contextmenu", onContextMenu)
    window.addEventListener("scroll", hide, true)
    window.addEventListener("resize", hide)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(null)
    })

    return () => {
      document.removeEventListener("mouseup", onMouseUp)
      document.removeEventListener("mousedown", onMouseDown)
      containerRef.current?.removeEventListener("contextmenu", onContextMenu)
      window.removeEventListener("scroll", hide, true)
      window.removeEventListener("resize", hide)
    }
  }, [containerRef])

  if (!menu) return null

  const handleAsk = () => {
    window.dispatchEvent(
      new CustomEvent("open-ai-chat", {
        detail: {
          prompt: `Regarding the blog post "${blogTitle}", please explain or discuss the following selection:\n\n"""\n${menu.text}\n"""`,
          codebaseContext: `Selected text from the blog post titled "${blogTitle}".`,
        },
      }),
    )
    setMenu(null)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menu.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[200] rounded-xl border shadow-2xl p-1.5 flex items-center gap-1 backdrop-blur-md"
      style={{
        left: menu.x,
        top: menu.y,
        transform: `translate(-50%, ${menu.below ? "0" : "-100%"})`,
        background: "var(--glass-bg)",
        borderColor: "color-mix(in srgb, var(--accent) 40%, var(--border))",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleAsk}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[var(--accent-dim)] whitespace-nowrap"
        style={{ color: "var(--accent)" }}
      >
        <Sparkles size={13} />
        Ask AI about this
      </button>
      <button
        onClick={handleCopy}
        title="Copy selection"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[var(--accent-dim)]"
        style={{ color: "var(--text-secondary)" }}
      >
        {copied ? (
          <Check size={13} className="text-green-500" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>,
    document.body,
  )
}
