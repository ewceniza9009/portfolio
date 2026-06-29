import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { GALLERY_DESCRIPTIONS } from '../data/gallery-descriptions'

interface GalleryImage {
  id: string
  src: string
  alt: string
  project: string
}

const PROJECTS: Record<string, { count: number }> = {
  CloudPallet: { count: 16 },
  Dev2ndBrain: { count: 6 },
  Halkyone: { count: 28 },
  JsPlay: { count: 4 },
  NexPoint: { count: 17 },
  OppStack: { count: 3 },
  SmashElite: { count: 20 }
}

const PROJECT_ORDER = ['Halkyone', 'NexPoint', 'CloudPallet', 'SmashElite', 'Dev2ndBrain', 'OppStack', 'JsPlay']
const IMAGES_PER_PAGE = 10

function buildGalleryImages(): GalleryImage[] {
  const images: GalleryImage[] = []
  PROJECT_ORDER.forEach(project => {
    const count = PROJECTS[project].count
    for (let i = 1; i <= count; i++) {
      images.push({
        id: `${project.toLowerCase()}-${i}`,
        src: `/gallery/${project}/${i}.png`,
        alt: GALLERY_DESCRIPTIONS[project]?.[i] || `${project} screenshot ${i}`,
        project
      })
    }
  })
  return images
}

export default function GallerySection() {
  const allImages = useMemo(() => buildGalleryImages(), [])
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredImages = useMemo(() => {
    if (activeFilter === 'all') return allImages
    return allImages.filter(img => img.project === activeFilter)
  }, [allImages, activeFilter])

  const totalPages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE)
  const paginatedImages = useMemo(() => {
    const start = (currentPage - 1) * IMAGES_PER_PAGE
    return filteredImages.slice(start, start + IMAGES_PER_PAGE)
  }, [filteredImages, currentPage])

  useEffect(() => { setCurrentPage(1) }, [activeFilter])

  const handleNext = useCallback(() => {
    setLightboxIndex(prev => prev !== null ? (prev + 1) % filteredImages.length : null)
  }, [filteredImages.length])

  const handlePrev = useCallback(() => {
    setLightboxIndex(prev => prev !== null ? (prev - 1 + filteredImages.length) % filteredImages.length : null)
  }, [filteredImages.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    document.addEventListener('keydown', handleKeyDown)

    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [lightboxIndex, handleNext, handlePrev])

  const currentLightboxImage = lightboxIndex !== null ? filteredImages[lightboxIndex] : null

  return (
    <>
      <section id="gallery" className="py-24 px-6" style={{ background: 'var(--bg-section)' }}>
        <div className="section-divider max-w-6xl mx-auto mb-20" />

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-bold font-display"
              >
                Gallery
              </motion.h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {filteredImages.length} screenshots
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                style={{
                  background: activeFilter === 'all' ? 'var(--accent)' : 'transparent',
                  borderColor: activeFilter === 'all' ? 'var(--accent)' : 'var(--border)',
                  color: activeFilter === 'all' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
              >
                All
              </button>
              {PROJECT_ORDER.map(p => (
                <button
                  key={p}
                  onClick={() => setActiveFilter(p)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                  style={{
                    background: activeFilter === p ? 'var(--accent)' : 'transparent',
                    borderColor: activeFilter === p ? 'var(--accent)' : 'var(--border)',
                    color: activeFilter === p ? 'var(--bg-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid - Bento Paginated */}
          <div 
            className="w-full h-[650px] sm:h-[600px] md:h-[620px] lg:h-[500px] xl:h-[450px] transition-all duration-500 p-4 sm:p-6 rounded-2xl border relative overflow-hidden"
            style={{ 
              background: 'var(--bg-card)',
              borderColor: 'var(--border)'
            }}
          >
            {/* Tech doodles background */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              style={{ opacity: 0.25 }}
              viewBox="0 0 1200 600"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Grid dots */}
              <pattern id="galleryCanvasDots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="var(--accent)" opacity="0.6" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#galleryCanvasDots)" />

              {/* Angle brackets */}
              <text x="40" y="80" fontSize="48" fontFamily="monospace" fontWeight="700" fill="var(--accent)" opacity="0.8">&lt;/&gt;</text>
              <text x="1080" y="140" fontSize="36" fontFamily="monospace" fontWeight="700" fill="var(--accent-secondary)" opacity="0.7">{"{"} {"}"}</text>
              <text x="60" y="420" fontSize="28" fontFamily="monospace" fill="var(--accent)" opacity="0.6">const</text>
              <text x="1100" y="420" fontSize="32" fontFamily="monospace" fontWeight="700" fill="var(--accent-secondary)" opacity="0.65">=&gt;</text>
              <text x="80" y="520" fontSize="24" fontFamily="monospace" fill="var(--accent)" opacity="0.55">async</text>

              {/* Horizontal connector lines */}
              <line x1="120" y1="85" x2="200" y2="85" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
              <line x1="100" y1="200" x2="150" y2="200" stroke="var(--accent-secondary)" strokeWidth="1" opacity="0.6" />
              <line x1="1050" y1="350" x2="1130" y2="350" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />

              {/* Floating circles */}
              <circle cx="950" cy="60" r="6" fill="var(--accent)" opacity="0.7" />
              <circle cx="50" cy="320" r="8" fill="var(--accent-secondary)" opacity="0.6" />
              <circle cx="1120" cy="530" r="5" fill="var(--accent)" opacity="0.8" />

              {/* Decorative small plus signs */}
              <text x="300" y="480" fontSize="20" fontFamily="monospace" fill="var(--accent)" opacity="0.6">+</text>
              <text x="840" y="280" fontSize="18" fontFamily="monospace" fill="var(--accent-secondary)" opacity="0.55">*</text>
              <text x="100" y="580" fontSize="16" fontFamily="monospace" fill="var(--accent)" opacity="0.5">#</text>
            </svg>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 auto-rows-[100px] md:auto-rows-[130px] grid-flow-dense relative z-10">
              {paginatedImages.map((image, index) => {
                // Generate a stable pseudo-random number based on the image ID to determine size
                const hash = image.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                const isFeatured = hash % 7 === 0
                const isWide = hash % 5 === 0 && !isFeatured
                const isTall = hash % 8 === 0 && !isFeatured && !isWide
                
                return (
                <div
                  key={image.id}
                  className={`relative rounded-xl overflow-hidden cursor-pointer clickable-item group border bg-[var(--bg-section)] shadow-md hover:shadow-xl hover:-translate-y-1 hover:z-10 transition-all duration-500
                    ${isFeatured ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : ''}
                    ${isWide ? 'col-span-2 row-span-1' : ''}
                    ${isTall ? 'col-span-1 row-span-2' : ''}
                    ${!isFeatured && !isWide && !isTall ? 'col-span-1 row-span-1' : ''}
                  `}
                  style={{ 
                    borderColor: 'var(--border)',
                    boxShadow: '0 4px 15px -3px var(--accent-dim)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent), 0 10px 25px -2px var(--accent-dim)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = '0 4px 15px -3px var(--accent-dim)'
                  }}
                  onClick={() => setLightboxIndex(index + (currentPage - 1) * IMAGES_PER_PAGE)}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 group-hover:rotate-1 transition-transform duration-700 ease-out blur-[0.4px] group-hover:blur-0"
                    style={{ 
                      imageRendering: 'auto',
                      WebkitFontSmoothing: 'antialiased',
                      transform: 'translate3d(0,0,0)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                        {image.project}
                      </span>
                      <p className="text-white text-sm font-medium drop-shadow-lg leading-snug line-clamp-3">
                        {image.alt}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Page {currentPage} of {totalPages || 1}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-30"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) pageNum = i + 1
                  else if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: currentPage === pageNum ? 'var(--accent)' : 'transparent',
                        color: currentPage === pageNum ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-30"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Full Screen Lightbox */}
      <AnimatePresence>
        {currentLightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.97)' }}
            onClick={() => setLightboxIndex(null)}
          >
            {/* Tech doodles background */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              style={{ opacity: 0.15 }}
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
            >
              <pattern id="galleryDots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="var(--accent)" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#galleryDots)" />
              <text x="60" y="100" fontSize="48" fontFamily="monospace" fontWeight="700" fill="var(--accent)">{"< />"}</text>
              <text x="900" y="180" fontSize="36" fontFamily="monospace" fontWeight="700" fill="var(--accent-secondary)">{"{}"}</text>
              <text x="100" y="350" fontSize="24" fontFamily="monospace" fill="var(--accent)">const</text>
              <text x="950" y="450" fontSize="28" fontFamily="monospace" fontWeight="700" fill="var(--accent-secondary)">{"=>"}</text>
              <text x="150" y="550" fontSize="20" fontFamily="monospace" fill="var(--accent)">async</text>
              <line x1="180" y1="110" x2="320" y2="110" stroke="var(--accent)" strokeWidth="1" />
              <line x1="150" y1="230" x2="280" y2="230" stroke="var(--accent-secondary)" strokeWidth="1" />
              <circle cx="1100" cy="80" r="6" fill="var(--accent)" />
              <circle cx="80" cy="480" r="8" fill="var(--accent-secondary)" />
              <circle cx="1050" cy="700" r="5" fill="var(--accent)" />
              <text x="50" y="200" fontSize="80" fontFamily="monospace" fontWeight="700" fill="none" stroke="var(--accent)" strokeWidth="0.5">01</text>
              <text x="900" y="550" fontSize="60" fontFamily="monospace" fontWeight="700" fill="none" stroke="var(--accent-secondary)" strokeWidth="0.5">02</text>
            </svg>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 rounded text-sm font-semibold text-black bg-white">
                  {currentLightboxImage.project}
                </span>
                <span className="text-sm font-mono text-white/80">
                  {lightboxIndex! + 1} / {filteredImages.length}
                </span>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Nav */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev() }}
              className="absolute left-4 z-20 p-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={32} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              className="absolute right-4 z-20 p-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={32} />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full p-4 md:p-16 flex flex-col items-center justify-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentLightboxImage.src}
                alt={currentLightboxImage.alt}
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black via-black/60 to-transparent flex justify-center pointer-events-none">
                <p 
                  className="text-lg md:text-xl text-white font-medium text-center max-w-4xl tracking-wide"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.6)' }}
                >
                  {currentLightboxImage.alt}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}