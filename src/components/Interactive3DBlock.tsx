import { useRef, useEffect } from 'react'

interface Interactive3DBlockProps {
  html: string
  height?: string
}

const I3D_VERSION = 'v2.1'

export default function Interactive3DBlock({ html, height = '420px' }: Interactive3DBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log(`[i3d ${I3D_VERSION}] mounting`)
    if (!containerRef.current) return
    const container = containerRef.current

    // Clear any previous content
    container.innerHTML = ''

    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative;'
    wrapper.innerHTML = html
    container.appendChild(wrapper)

    let running = true
    let animFrameId = 0
    let activePromise: Promise<unknown> | null = null

    const resolveUrl = (spec: string): string | null => {
      if (spec === 'three') return 'https://esm.sh/three@0.169.0'
      if (spec.startsWith('http')) {
        const s = spec.toLowerCase()
        if (s.includes('unpkg.com/three') || /@0\./.test(s) || /three@[\d.]/.test(s)) {
          if (s.includes('orbitcontrols')) return 'https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls'
          if (s.includes('css2dobject')) return 'https://esm.sh/three@0.169.0/examples/jsm/renderers/CSS2DObject'
          if (s.includes('css2d')) return 'https://esm.sh/three@0.169.0/examples/jsm/renderers/CSS2DRenderer'
          return 'https://esm.sh/three@0.169.0'
        }
      }
      return null
    }

    const runScripts = () => {
      if (!running) return
      const scripts = Array.from(wrapper.querySelectorAll('script:not([data-i3d-done])')) as HTMLScriptElement[]
      if (scripts.length === 0) {
        console.warn(`[i3d ${I3D_VERSION}] no scripts found in HTML block`)
        return
      }

      scripts.forEach(oldScript => {
        const rawCode = oldScript.textContent || ''
        const isModule = oldScript.type === 'module' || rawCode.trim().startsWith('import ')

        if (isModule) {
          const lines = rawCode.split('\n')
          const header: string[] = []
          const body: string[] = []

          for (const raw of lines) {
            const trimmed = raw.trim()
            if (!trimmed) { body.push(raw); continue }

            const match = trimmed.match(/^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/)
            if (match) {
              const url = resolveUrl(match[2])
              if (url) {
                const names = match[1].trim()
                const id = `__m${header.length}`
                header.push(`  const ${id} = await import('${url}');`)
                if (names.startsWith('*')) {
                  const vn = names.replace(/^\*\s+as\s+/, '').trim()
                  header.push(`  var ${vn} = ${id};`)
                } else if (names.startsWith('{')) {
                  const nc = names.replace(/^\{|\}$/g, '').trim()
                  if (nc) {
                    for (const n of nc.split(',')) {
                      const nn = n.trim()
                      if (nn) header.push(`  var ${nn} = ${id}.${nn};`)
                    }
                  }
                } else {
                  header.push(`  var ${names} = ${id};`)
                }
                continue
              }
            }
            body.push(raw)
          }

          if (header.length > 0) {
            // ASI safety: lines starting with [ or ( can be misread as
            // property access / function calls on the previous line.
            // Prepend a semicolon to prevent this classic JS gotcha.
            const safeBody = body.map(line => {
              const t = line.trimStart()
              if (t.startsWith('[') || t.startsWith('(')) {
                const indent = line.length - t.length
                return ' '.repeat(indent) + ';' + t
              }
              return line
            })
            const fnBody = header.join('\n') + '\n\n' + safeBody.join('\n')
            const asyncFn = `(async function(){\n${fnBody}\n})`
            const evalCode = `return ${asyncFn}()`
            console.log(`[i3d ${I3D_VERSION}] executing: ${header.length} imports, ${body.length} body lines`)
            try {
              const fn = new Function(evalCode)
              const p = fn()
              activePromise = p as Promise<unknown>
              p.catch((err: unknown) => {
                if (running) console.error(`[i3d ${I3D_VERSION}] runtime error:`, err)
              })
            } catch (e) {
              console.error(`[i3d ${I3D_VERSION}] compile error:`, e)
            }
          } else {
            console.warn(`[i3d ${I3D_VERSION}] no imports resolved – script may not work`)
          }
          oldScript.remove()
        } else {
          const newScript = document.createElement('script')
          Array.from(oldScript.attributes).forEach(attr => {
            if (attr.name !== 'type') newScript.setAttribute(attr.name, attr.value)
          })
          newScript.textContent = rawCode
          newScript.dataset.i3dDone = '1'
          wrapper.appendChild(newScript)
          oldScript.remove()
        }
      })
    }

    const canvases = Array.from(wrapper.querySelectorAll('canvas'))
    let resized = false

    const ro = new ResizeObserver(() => {
      if (!running || resized) return
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      resized = true
      canvases.forEach(canvas => { canvas.width = w; canvas.height = h })
      console.log(`[i3d ${I3D_VERSION}] canvas sized to ${w}x${h}, running scripts...`)
      runScripts()
      ro.disconnect()
    })

    ro.observe(container)

    const cleanup = () => {
      console.log(`[i3d ${I3D_VERSION}] cleanup`)
      running = false
      ro.disconnect()
      if (animFrameId) cancelAnimationFrame(animFrameId)
      if (activePromise) {
        (activePromise as Promise<void>).catch(() => {})
      }
      canvases.forEach(canvas => {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context')
          ext?.loseContext()
        }
      })
      // Remove any CSS2DRenderer overlays added by the script
      const overlays = wrapper.querySelectorAll('div[style*="position: absolute"]')
      overlays.forEach(el => el.remove())
      wrapper.remove()
    }

    return cleanup
  }, [html])

  return (
    <div
      className="my-6 rounded-xl border overflow-hidden"
      style={{
        height,
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}