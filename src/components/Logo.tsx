interface LogoProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

export default function Logo({ size = 40, className = '', style }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="EWC Logo"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent, #22c55e)" />
          <stop offset="100%" stopColor="var(--accent-hover, #16a34a)" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#logoGrad)" />
      {/* < bracket */}
      <polyline points="104,192 49,256 104,320" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      {/* E */}
      <path d="M178,192 L134,192 L134,320 L178,320" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="134" y1="256" x2="172" y2="256" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
      {/* W */}
      <polyline points="208,192 224,320 241,228 258,320 274,192" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      {/* C */}
      <path d="M344,192 L304,192 L304,320 L344,320" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      {/* / slash */}
      <line x1="384" y1="192" x2="370" y2="320" stroke="rgba(255,255,255,0.4)" strokeWidth="14" strokeLinecap="round" />
      {/* > bracket */}
      <polyline points="408,192 463,256 408,320" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
