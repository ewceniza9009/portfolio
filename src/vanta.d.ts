declare module 'vanta/dist/vanta.rings.min' {
  interface VantaOptions {
    el: HTMLElement
    mouseControls?: boolean
    touchControls?: boolean
    gyroControls?: boolean
    minHeight?: number
    minWidth?: number
    scale?: number
    scaleMobile?: number
    color?: number
    backgroundColor?: number
    backgroundAlpha?: number
  }

  interface VantaEffect {
    destroy: () => void
    resize: () => void
    restart: () => void
  }

  export default function (options: VantaOptions): VantaEffect
}

interface Window {
  THREE: any
}