import { Play } from 'lucide-react'
import type { AccentKey } from '../data/accents'

interface RemotionBlockProps {
  code: string
  theme?: 'dark' | 'light'
  accent?: AccentKey
}

interface RemotionConfig {
  src?: string
  component?: string
  durationInFrames?: number
  fps?: number
  compositionWidth?: number
  compositionHeight?: number
  loop?: boolean
  autoPlay?: boolean
  controls?: boolean
  title?: string
}

function parseConfig(code: string): RemotionConfig | null {
  try {
    const trimmed = code.trim()
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed) as RemotionConfig
    }
    const config: RemotionConfig = {}
    for (const line of trimmed.split('\n')) {
      const match = line.match(/^(\w+)\s*:\s*(.+)$/)
      if (match) {
        const [, key, value] = match
        if (key === 'durationInFrames' || key === 'fps' || key === 'compositionWidth' || key === 'compositionHeight') {
          (config as any)[key] = parseInt(value, 10)
        } else if (key === 'loop' || key === 'autoPlay' || key === 'controls') {
          (config as any)[key] = value === 'true'
        } else {
          (config as any)[key] = value.trim()
        }
      }
    }
    return config.src || config.component ? config : null
  } catch {
    return null
  }
}

export default function RemotionBlock({ code, theme = 'dark' }: RemotionBlockProps) {
  const config = parseConfig(code)
  const isDark = theme === 'dark'

  if (!config) {
    return (
      <div className="my-6 rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Invalid Remotion configuration. Use JSON format with <code className="bg-black/10 px-1.5 py-0.5 rounded text-xs">src</code> or <code className="bg-black/10 px-1.5 py-0.5 rounded text-xs">component</code> property.
        </p>
      </div>
    )
  }

  const headerBg = isDark ? '#161b22' : '#f6f8fa'
  const headerColor = isDark ? '#8b949e' : '#656d76'
  const headerBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  if (config.src && (config.src.endsWith('.mp4') || config.src.endsWith('.webm') || config.src.endsWith('.ogg'))) {
    return (
      <div className="my-6 rounded-2xl overflow-hidden rm-container" style={{ background: isDark ? '#0d1117' : '#ffffff' }}>
        <style>{`
          @keyframes rm-container-in {
            0% { opacity: 0; transform: translateY(20px) scale(0.97); filter: blur(4px); }
            60% { opacity: 1; filter: blur(0); }
            100% { transform: translateY(0) scale(1); }
          }
          @keyframes rm-border-in {
            0% { border-color: transparent; }
            100% { border-color: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}; }
          }
          @keyframes rm-shadow-in {
            0% { box-shadow: 0 0 0 0 transparent; }
            100% { box-shadow: 0 8px 32px -8px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'}, 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}; }
          }
          .rm-container {
            animation: rm-container-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both,
                       rm-border-in 0.6s 0.1s ease both,
                       rm-shadow-in 0.6s 0.15s ease both;
            border: 1px solid transparent;
          }
          @keyframes rm-header-in { from { opacity: 0; } to { opacity: 1; } }
          .rm-header { animation: rm-header-in 0.3s 0.2s ease both; }
        `}</style>
        {config.title && (
          <div className="rm-header px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider select-none border-b" style={{ background: headerBg, color: headerColor, borderColor: headerBorder }}>
            {config.title}
          </div>
        )}
        <video
          src={config.src}
          className="w-full"
          controls={config.controls ?? true}
          loop={config.loop}
          autoPlay={config.autoPlay}
          style={{ background: '#000' }}
        />
      </div>
    )
  }

  if (config.src && (config.src.includes('youtube.com') || config.src.includes('vimeo.com') || config.src.includes('youtu.be'))) {
    let embedUrl = config.src
    if (config.src.includes('youtube.com/watch?v=')) {
      embedUrl = `https://www.youtube.com/embed/${new URL(config.src).searchParams.get('v')}`
    } else if (config.src.includes('youtu.be/')) {
      embedUrl = `https://www.youtube.com/embed/${config.src.split('youtu.be/')[1]}`
    }
    return (
      <div className="my-6 rounded-2xl overflow-hidden rm-container" style={{ background: isDark ? '#0d1117' : '#ffffff' }}>
        <style>{`
          @keyframes rm-container-in {
            0% { opacity: 0; transform: translateY(20px) scale(0.97); filter: blur(4px); }
            60% { opacity: 1; filter: blur(0); }
            100% { transform: translateY(0) scale(1); }
          }
          @keyframes rm-border-in {
            0% { border-color: transparent; }
            100% { border-color: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}; }
          }
          @keyframes rm-shadow-in {
            0% { box-shadow: 0 0 0 0 transparent; }
            100% { box-shadow: 0 8px 32px -8px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'}, 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}; }
          }
          .rm-container {
            animation: rm-container-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both,
                       rm-border-in 0.6s 0.1s ease both,
                       rm-shadow-in 0.6s 0.15s ease both;
            border: 1px solid transparent;
          }
          @keyframes rm-header-in { from { opacity: 0; } to { opacity: 1; } }
          .rm-header { animation: rm-header-in 0.3s 0.2s ease both; }
        `}</style>
        {config.title && (
          <div className="rm-header px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider select-none border-b" style={{ background: headerBg, color: headerColor, borderColor: headerBorder }}>
            {config.title}
          </div>
        )}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    )
  }

  // Remotion composition placeholder
  return (
    <div className="my-6 rounded-2xl overflow-hidden rm-container" style={{ background: isDark ? '#0d1117' : '#ffffff' }}>
      <style>{`
        @keyframes rm-container-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.97); filter: blur(4px); }
          60% { opacity: 1; filter: blur(0); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes rm-border-in {
          0% { border-color: transparent; }
          100% { border-color: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}; }
        }
        @keyframes rm-shadow-in {
          0% { box-shadow: 0 0 0 0 transparent; }
          100% { box-shadow: 0 8px 32px -8px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'}, 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}; }
        }
        .rm-container {
          animation: rm-container-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both,
                     rm-border-in 0.6s 0.1s ease both,
                     rm-shadow-in 0.6s 0.15s ease both;
          border: 1px solid transparent;
        }
        @keyframes rm-header-in { from { opacity: 0; } to { opacity: 1; } }
        .rm-header { animation: rm-header-in 0.3s 0.2s ease both; }

        @keyframes rm-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes rm-play-in {
          0% { opacity: 0; transform: scale(0.8); }
          60% { opacity: 1; transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes rm-play-pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--accent-dim); }
          50% { box-shadow: 0 0 24px 4px var(--accent-dim); }
        }
        @keyframes rm-icon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes rm-film-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rm-accent-bar {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>
      {config.title && (
        <div className="rm-header px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider select-none border-b flex items-center justify-between" style={{ background: headerBg, color: headerColor, borderColor: headerBorder }}>
          <span>{config.title}</span>
          <div className="flex items-center gap-2" style={{ color: isDark ? '#484f58' : '#d0d7de' }}>
            <span>{config.fps || 30} fps</span>
            <span>{config.durationInFrames || 120} frames</span>
          </div>
        </div>
      )}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f6f8fa 50%, #ffffff 100%)',
          backgroundSize: '200% 200%',
          animation: 'rm-shimmer 4s ease infinite',
          minHeight: '240px',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, ${isDark ? '#ffffff' : '#000000'} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 p-8 text-center">
          <div
            className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-105 group/play"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              animation: 'rm-play-in 0.6s 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl"
              style={{
                background: 'var(--accent-dim)',
                animation: 'rm-play-pulse 3s ease-in-out infinite',
              }}
            >
              <Play size={22} className="text-[var(--accent)] ml-0.5" style={{ animation: 'rm-icon-float 2s ease-in-out infinite' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: isDark ? '#e6edf3' : '#24292f' }}>
                {config.component || 'Remotion Composition'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: isDark ? '#8b949e' : '#656d76' }}>
                {config.compositionWidth || 1920}x{config.compositionHeight || 1080} · {config.fps || 30}fps · {config.durationInFrames || 120} frames
              </p>
            </div>
          </div>

          {/* Film strip decoration */}
          <div className="flex items-center justify-center gap-1.5 mt-4 opacity-30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'var(--accent)',
                  animation: `rm-film-spin ${2 + i * 0.3}s linear infinite`,
                  opacity: 0.3 + (i % 3) * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="relative overflow-hidden" style={{ height: '2px' }}>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            transformOrigin: 'left',
            animation: 'rm-accent-bar 1.2s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        />
      </div>
    </div>
  )
}
