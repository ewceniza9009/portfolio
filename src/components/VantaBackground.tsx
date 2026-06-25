import { useEffect, useRef, useState } from 'react'

export default function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<any>(null)
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') !== 'light' ? 'dark' : 'light'
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') !== 'light' ? 'dark' : 'light'
      setTheme(current)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Check for reduced motion preference or mobile device to prevent scroll stutter
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (window.innerWidth < 768) {
      return;
    }

    async function init() {
      const three = await import('three')
      window.THREE = three
      const RINGS = (await import('vanta/dist/vanta.rings.min')).default

      if (vantaRef.current) {
        if (effectRef.current) {
          effectRef.current.destroy()
          effectRef.current = null
        }
        effectRef.current = RINGS({
          el: vantaRef.current,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: theme === 'dark' ? 0x22c55e : 0x16a34a,
          backgroundColor: theme === 'dark' ? 0x0a0a0a : 0xf8fafc,
          backgroundAlpha: 0,
        })
      }
    }
    init()
    return () => {
      if (effectRef.current) {
        effectRef.current.destroy()
        effectRef.current = null
      }
    }
  }, [theme])

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