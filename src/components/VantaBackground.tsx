import { useEffect, useRef, useState } from 'react'
import { ACCENT_THEMES } from '../data/accents'
import type { AccentKey } from '../data/accents'

export default function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<any>(null)
  const isIntersectingRef = useRef(true)
  const loopControlRef = useRef<{ start: () => void; stop: () => void } | null>(null)
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
  }, [])

  // 3. Vanta effect initialization + a throttled, pausable render loop (mount/unmount only)
  useEffect(() => {
    let isMounted = true
    let rafId: number | null = null
    let lastTime = 0
    const FPS = 30
    const FRAME = 1000 / FPS

    const isVisible = () => document.visibilityState === 'visible'

    const loop = (t: number) => {
      rafId = requestAnimationFrame(loop)
      if (t - lastTime < FRAME) return
      lastTime = t
      effectRef.current?.render?.()
    }

    const start = () => {
      if (rafId == null) {
        lastTime = 0
        rafId = requestAnimationFrame(loop)
      }
    }
    const stop = () => {
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    loopControlRef.current = { start, stop }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
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
          scaleMobile: 1.00,
          color: colorNum,
          backgroundColor: bgColorNum,
          backgroundAlpha: 0,
        })
        // Cap device pixel ratio so the full-screen canvas isn't rendered at 2x/3x
        effectRef.current.renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 1.5))

        if (isVisible() && isIntersectingRef.current) start()
      }
    }
    init()

    return () => {
      isMounted = false
      stop()
      loopControlRef.current = null
      if (effectRef.current) {
        effectRef.current.destroy()
        effectRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // 4. Pause/resume rendering based on intersection + tab visibility (no destroy/recreate)
  useEffect(() => {
    isIntersectingRef.current = isIntersecting
    const ctrl = loopControlRef.current
    if (!ctrl) return
    if (isIntersecting && document.visibilityState === 'visible') ctrl.start()
    else ctrl.stop()
  }, [isIntersecting])

  // 5. Pause rendering when the tab is hidden to save CPU/GPU
  useEffect(() => {
    const onVisibility = () => {
      const ctrl = loopControlRef.current
      if (!ctrl) return
      if (document.visibilityState === 'visible' && isIntersectingRef.current) ctrl.start()
      else ctrl.stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // 6. Pause the render loop while scrolling; resume ~250ms after it stops.
  //    This keeps the background alive when idle but never competes with the
  //    compositor during scroll, which is what made scrolling stutter.
  useEffect(() => {
    let scrollTimer: any
    const onScroll = () => {
      const ctrl = loopControlRef.current
      if (!ctrl) return
      ctrl.stop()
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        if (isIntersectingRef.current && document.visibilityState === 'visible') ctrl.start()
      }, 250)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(scrollTimer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

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
        opacity: isIntersecting ? 1 : 0,
        willChange: "opacity",
      }}
    />
  )
}