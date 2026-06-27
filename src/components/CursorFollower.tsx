import { useEffect } from 'react'

export default function CursorFollower() {
  useEffect(() => {
    // Check if pointer is fine (desktop) and reduced-motion is not requested
    const mqPointer = window.matchMedia('(pointer: fine)')
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!mqPointer.matches || mqMotion.matches) return

    const cursorRing = document.createElement('div')
    cursorRing.className = 'cursor-ring'
    document.body.appendChild(cursorRing)
    document.body.classList.add('custom-cursor-active')

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100

    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const animateRing = () => {
      // Snappier easing (0.28 instead of 0.15) for high accuracy and no delay feeling
      const easing = 0.28
      ringX += (mouseX - ringX) * easing
      ringY += (mouseY - ringY) * easing
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      animId = requestAnimationFrame(animateRing)
    }

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isHoverable = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') || 
        target.closest('.project-card') || 
        target.closest('.contact-card') ||
        target.closest('.contact-input') ||
        target.closest('.clickable-item')

      if (isHoverable) {
        cursorRing.classList.add('cursor-hover')
      } else {
        cursorRing.classList.remove('cursor-hover')
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseover', onMouseOver)
    animId = requestAnimationFrame(animateRing)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
      cancelAnimationFrame(animId)
      cursorRing.remove()
      document.body.classList.remove('custom-cursor-active')
    }
  }, [])

  return null
}
