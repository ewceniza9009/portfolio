import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'

interface CheatsheetModalProps {
  open: boolean
  onClose: () => void
  groups: { title: string; shortcuts: { keys: string; description: string }[] }[]
}

export default function CheatsheetModal({ open, onClose, groups }: CheatsheetModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.18 }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[101] rounded-3xl p-6 shadow-2xl border"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Keyboard size={16} style={{ color: 'var(--accent)' }} />
                <h2 className="text-sm font-bold uppercase tracking-wider">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close shortcuts"
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    {group.title}
                  </p>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((shortcut) => (
                      <div key={shortcut.keys} className="flex items-center justify-between gap-3 text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>{shortcut.description}</span>
                        <kbd
                          className="px-2 py-0.5 rounded-md font-sans font-semibold text-[10px] border tracking-wider whitespace-nowrap"
                          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                          {shortcut.keys.split('+').map((k, i, arr) => (
                            <span key={`${k}-${i}`}>
                              {arr.length > 1 && i > 0 ? <span className="opacity-40 mx-0.5">+</span> : null}
                              {k}
                            </span>
                          ))}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t text-[10px] flex items-center justify-between" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <span>Tip: shortcuts ignore typing in form fields.</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>ESC</kbd> to reset.</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
