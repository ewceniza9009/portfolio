import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function TechLoader({ onComplete }: { onComplete: () => void }) {
  const [textIndex, setTextIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const texts = [
    "INITIALIZING_SYSTEM_CORE",
    "LOADING_UI_COMPONENTS",
    "ESTABLISHING_SECURE_CONNECTION",
    "RENDERING_3D_ENVIRONMENT",
    "SYSTEM_READY_0X99"
  ]

  useEffect(() => {
    // Progress bar simulation (fast)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + Math.floor(Math.random() * 20) + 10
      })
    }, 80)

    // Text sequence
    const textInterval = setInterval(() => {
      setTextIndex(i => {
        if (i < texts.length - 1) return i + 1
        clearInterval(textInterval)
        return i
      })
    }, 250)

    return () => {
      clearInterval(interval)
      clearInterval(textInterval)
    }
  }, [])

  useEffect(() => {
    if (progress >= 100 && textIndex === texts.length - 1) {
      const t = setTimeout(onComplete, 400)
      return () => clearTimeout(t)
    }
  }, [progress, textIndex, onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-primary)] font-mono"
    >
      <div className="w-full max-w-md px-6 flex flex-col gap-6">
        {/* Geometric Hexagon Spinner */}
        <div className="flex justify-center mb-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="w-24 h-24 relative flex items-center justify-center"
            style={{ filter: "drop-shadow(0 0 4px var(--accent-dim))", willChange: "transform" }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full fill-transparent stroke-[var(--accent)] stroke-[2]">
              <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" />
            </svg>
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-2"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full fill-transparent stroke-[var(--text-secondary)] stroke-[1] opacity-50">
                <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" />
              </svg>
            </motion.div>
            <div className="absolute font-bold text-xl font-display tracking-widest text-[var(--text-primary)]">EWC</div>
          </motion.div>
        </div>

        {/* Loader text and percentage */}
        <div className="flex justify-between text-xs tracking-widest opacity-80 uppercase mb-2 text-[var(--accent)]">
          <span>{texts[textIndex]}</span>
          <span>{Math.min(progress, 100)}%</span>
        </div>
        
        {/* Glowing Progress bar */}
        <div className="h-[2px] w-full bg-[var(--border)] overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-[var(--accent)]"
            style={{ width: `${Math.min(progress, 100)}%`, boxShadow: "0 0 10px var(--accent)" }}
          />
        </div>

        {/* Console output simulation */}
        <div className="h-32 overflow-hidden mt-2 text-[10px] opacity-50 flex flex-col justify-end gap-1 text-[var(--text-secondary)]">
          {texts.slice(0, textIndex + 1).map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {`> system.execute("${t}")`}
            </motion.div>
          ))}
          {progress >= 100 && textIndex === texts.length - 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[var(--accent)] mt-2"
            >
              {"> [OK] LAUNCH SEQUENCE INITIATED"}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
