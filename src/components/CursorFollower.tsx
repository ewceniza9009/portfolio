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
      
      const dx = mouseX - ringX
      const dy = mouseY - ringY
      
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        ringX += dx * easing
        ringY += dy * easing
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }
      
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

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Prevent ripples on specific elements (like theme togglers)
      if (target.closest('.no-ripple')) {
        return;
      }

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
        createBurst(e.clientX, e.clientY)
      }
    }

    const createRipple = (x: number, y: number, isSecondary: boolean = false) => {
      const ripple = document.createElement('div')
      ripple.className = 'click-ripple'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      document.body.appendChild(ripple)
      
      const animation = ripple.animate([
        { transform: 'translate(-50%, -50%) scale(0.5)', opacity: isSecondary ? 0.4 : 0.8 },
        { transform: 'translate(-50%, -50%) scale(4.5)', opacity: 0 }
      ], {
        duration: isSecondary ? 1500 : 1000,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
      })
      
      animation.onfinish = () => ripple.remove()
    }

    const createBurst = (x: number, y: number) => {
      createRipple(x, y)
      createRipple(x, y, true) // Second ripple simultaneous but slower
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseover', onMouseOver)
    window.addEventListener('click', onClick)
    animId = requestAnimationFrame(animateRing)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
      window.removeEventListener('click', onClick)
      cancelAnimationFrame(animId)
      cursorRing.remove()
      document.body.classList.remove('custom-cursor-active')
    }
  }, [])

  return null
}
