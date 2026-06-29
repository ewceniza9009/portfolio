import { useEffect, useRef, useState } from 'react'
import { ACCENT_THEMES } from '../data/accents'
import type { AccentKey } from '../data/accents'

export default function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.getAttribute('data-theme') !== 'light' ? 'dark' : 'light'
  )
  const [accent, setAccent] = useState<AccentKey>(() =>
    (document.documentElement.getAttribute('data-accent') as AccentKey) || 'gold'
  )
  const [isIntersecting, setIsIntersecting] = useState(true)

  // 1. Intersection Observer to disable WebGL off-screen
  useEffect(() => {
    if (!vantaRef.current) return
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, { threshold: 0.01 })
    
    observer.observe(vantaRef.current)
    return () => observer.disconnect()
  }, [])

  // 2. Mutation Observer with delayed theme switch to keep transitions smooth
  useEffect(() => {
    let timeoutId: any;
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') !== 'light' ? 'dark' : 'light'
      const currentAccent = (document.documentElement.getAttribute('data-accent') as AccentKey) || 'gold'
      
      setTheme(currentTheme)
      setAccent(currentAccent)
    })
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent'] })
    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [theme])

  // 3. Vanta effect initialization (mount/unmount/intersection)
  useEffect(() => {
    let isMounted = true;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (!isIntersecting) {
      if (effectRef.current) {
        effectRef.current.destroy()
        effectRef.current = null
      }
      return
    }

    async function init() {
      if (effectRef.current) return; // Already initialized

      const colorHex = ACCENT_THEMES[accent]?.[theme]?.accent || '#f3ca65'
      const colorNum = parseInt(colorHex.replace('#', '0x'), 16)
      const bgColorNum = theme === 'dark' ? 0x0a0a0a : 0xffffff

      const three = await import('three')
      if (!isMounted) return;
      window.THREE = three
      const RINGS = (await import('vanta/dist/vanta.rings.min')).default
      if (!isMounted) return;

      if (vantaRef.current) {
        effectRef.current = RINGS({
          el: vantaRef.current,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 2.00,
          color: colorNum,
          backgroundColor: bgColorNum,
          backgroundAlpha: 0,
        })
      }
    }
    init()

    return () => {
      isMounted = false;
      // Only destroy on unmount or when not intersecting
      if (effectRef.current) {
        effectRef.current.destroy()
        effectRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntersecting]) // Only re-run when intersection changes

  // 4. Update Vanta colors without destroying the context
  useEffect(() => {
    if (!effectRef.current || typeof effectRef.current.setOptions !== 'function') return;
    
    const colorHex = ACCENT_THEMES[accent]?.[theme]?.accent || '#f3ca65'
    const colorNum = parseInt(colorHex.replace('#', '0x'), 16)
    const bgColorNum = theme === 'dark' ? 0x0a0a0a : 0xffffff

    effectRef.current.setOptions({
      color: colorNum,
      backgroundColor: bgColorNum
    })
  }, [theme, accent])

  return (
    <div
      ref={vantaRef}
      className="absolute top-[10vh] left-[15vw] w-[120vw] h-[120vh] z-0 pointer-events-none vanta-fallback"
      style={{
        WebkitMaskImage: "radial-gradient(closest-side at center, black 30%, transparent 90%)",
        maskImage: "radial-gradient(closest-side at center, black 30%, transparent 90%)",
      }}
    />
  )
}