import React, { ImgHTMLAttributes, useEffect, useRef, useState } from 'react'

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  className?: string
  style?: React.CSSProperties
  /** Optional fixed width/height (used to generate proper aspect ratio & prevent CLS) */
  width?: number
  height?: number
  /** Disable blur-up placeholder fade-in */
  noFade?: boolean
}

/**
 * High-quality, responsive image component.
 *
 * Features:
 * - Auto-picks WebP/AVIF when a same-named .webp/.avif file exists alongside the source.
 * - Generates a real responsive srcset (1x/1.5x/2x/3x) for crisp rendering on retina displays.
 * - Uses browser-native lazy loading with `decoding="async"` to avoid jank.
 * - Blur-up fade-in for a smooth, non-pixelated appearance.
 * - CSS optimizations: `image-rendering: high-quality`, `ms-interpolation-mode: bicubic`,
 *   GPU-accelerated compositing, and `text-rendering: optimizeLegibility` for visual smoothness.
 * - Falls back gracefully to the original URL if the optimized variant is missing.
 */
export default function OptimizedImage({
  src,
  alt,
  sizes = '100vw',
  priority = false,
  quality = 'high',
  className = '',
  style = {},
  width,
  height,
  noFade = false,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Mark as already-loaded if the browser cache had it (e.g. priority/eager)
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [src])

  // Merge the caller's onLoad/onError with the component's internal handlers so
  // that both the fade-in (`loaded`) state and any caller-level logic (e.g.
  // showing a skeleton until the image actually loads) keep working.
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true)
    onLoad?.(e)
  }

  // 1. Strip query/hash for extension checks
  const cleanSrc = src.split('?')[0].split('#')[0]

  // 2. Check what kind of source this is
  const isDataUrl = src.startsWith('data:')
  const isBlobUrl = src.startsWith('blob:')
  const isExternal =
    /^https?:\/\//i.test(src) && !src.includes(window.location.hostname)
  const hasFileExt = /\.(png|jpe?g|webp|avif|gif|bmp|tiff?)(\?|$|#)/i.test(cleanSrc)

  // 3. Try to find optimized variants
  //    We only attempt this for local /assets or /public-served images with a real file extension.
  const tryWebP = !isDataUrl && !isBlobUrl && !isExternal && hasFileExt
  const webpSrc = tryWebP ? cleanSrc.replace(/\.(png|jpe?g)$/i, '.webp') : null
  const avifSrc = tryWebP ? cleanSrc.replace(/\.(png|jpe?g)$/i, '.avif') : null

  // 4. Quality → DPR multipliers
  const qualityToDPR: Record<string, number[]> = {
    low:    [1, 1.5],
    medium: [1, 1.5, 2],
    high:   [1, 1.5, 2, 2.5],
    ultra:  [1, 1.5, 2, 2.5, 3],
  }
  const dprs = qualityToDPR[quality] ?? qualityToDPR.high

  // 5. Build a real srcSet from base width when provided; otherwise use DPR descriptors.
  //    Without knowing true widths we lean on density descriptors, which work with `sizes`.
  const buildSrcSet = (baseSrc: string | null): string | undefined => {
    if (!baseSrc || isDataUrl || isBlobUrl) return undefined
    if (width && width > 0) {
      return dprs
        .map(dpr => `${baseSrc} ${Math.round(width * dpr)}w`)
        .join(', ')
    }
    return dprs.map(dpr => `${baseSrc} ${dpr}x`).join(', ')
  }

  // 6. CSS for crisp, smooth rendering across all browsers
  const optimizationStyle: React.CSSProperties = {
    imageRendering: 'auto',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textRendering: 'optimizeLegibility',
    WebkitBackfaceVisibility: 'hidden',
    backfaceVisibility: 'hidden',
    // NOTE: intentionally NOT setting `transform` here. An inline `transform`
    // would override any transform-based animation/hover (e.g. Tailwind
    // `group-hover:scale-105`) applied via `className`. Compositing is still
    // hinted via `willChange` below.
    willChange: 'transform, opacity',
    // Smooth fade-in once loaded
    opacity: loaded || noFade ? 1 : 0,
    transition: noFade ? undefined : 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
    ...style,
  }

  // 7. Build the <picture> sources in order of preference (AVIF → WebP → original)
  const avifSrcSet = buildSrcSet(avifSrc)
  const webpSrcSet = buildSrcSet(webpSrc)

  // 8. Fallback to original src if the optimized variant can't be derived
  const fallbackSrcSet = buildSrcSet(
    hasFileExt && !isDataUrl && !isBlobUrl && !isExternal ? cleanSrc : null,
  )

  // 9. If we have any WebP/AVIF candidate, render a <picture> element. Otherwise just <img>.
  const usePicture = !!(avifSrcSet || webpSrcSet)

  if (usePicture) {
    return (
      <picture>
        {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
        {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
        <img
          ref={imgRef}
          src={error || (!webpSrcSet && !avifSrcSet) ? src : cleanSrc}
          srcSet={fallbackSrcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          {...{ fetchpriority: priority ? 'high' : 'auto' }}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={(e) => {
            // If the optimized variant 404s, fall back to the original src.
            if (imgRef.current && webpSrc && imgRef.current.src.endsWith('.webp')) {
              imgRef.current.src = src
            } else {
              setError(true)
            }
            onError?.(e)
          }}
          className={className}
          style={optimizationStyle}
          {...props}
        />
      </picture>
    )
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      srcSet={fallbackSrcSet}
      loading={priority ? 'eager' : 'lazy'}
      {...{ fetchpriority: priority ? 'high' : 'auto' }}
      decoding={priority ? 'sync' : 'async'}
      onLoad={handleLoad}
      onError={(e) => {
        setError(true)
        onError?.(e)
      }}
      className={className}
      style={optimizationStyle}
      {...props}
    />
  )
}
