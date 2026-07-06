import { useEffect, useRef } from 'react'

export interface ShortcutBinding {
  keys: string
  description: string
  action: () => void
}

export interface ShortcutGroup {
  title: string
  shortcuts: ShortcutBinding[]
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable === true
}

export function useKeyboardShortcuts(
  groups: ShortcutGroup[],
  onOpenHelp: () => void,
) {
  const ref = useRef({ groups, onOpenHelp })

  useEffect(() => {
    ref.current = { groups, onOpenHelp }
  }, [groups, onOpenHelp])

  useEffect(() => {
    let pendingKeys: string[] = []
    let lastKeyAt = 0

    const reset = () => {
      pendingKeys = []
      lastKeyAt = 0
    }

    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (isEditableElement(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const now = Date.now()
      const key = e.key.toLowerCase()
      if (now - lastKeyAt > 1500) pendingKeys = []
      lastKeyAt = now

      if (e.shiftKey && key === '/') {
        e.preventDefault()
        ref.current.onOpenHelp()
        reset()
        return
      }
      if (e.key === 'Escape') {
        reset()
        return
      }

      pendingKeys.push(key)
      const combined = pendingKeys.join('+')
      for (const group of ref.current.groups) {
        const match = group.shortcuts.find((s) => s.keys === combined)
        if (match) {
          e.preventDefault()
          match.action()
          reset()
          return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
