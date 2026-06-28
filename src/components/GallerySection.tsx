import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronLeft, ChevronRight 
} from 'lucide-react'

interface GalleryImage {
  id: string
  src: string
  alt: string
  project: string
}

const PROJECTS: Record<string, { descriptions: string[]; count: number }> = {
  CloudPallet: { descriptions: ['Cold storage WMS dashboard overview','Receiving workflow interface','Yard management dock scheduling','Inventory location mapping','Temperature zone configuration','Billing and invoice generation','Pick list confirmation screen','Putaway task assignment','Real-time dock monitoring','Warehouse room temperature settings','Material registration form','Account management interface','Carrier setup configuration','Cargo manifest creation','VAS service recording screen','Report generation interface'], count: 16 },
  Dev2ndBrain: { descriptions: ['Knowledge base dashboard','Article editor interface','Category organization view','Search functionality demonstration','Note-taking interface','Code snippet storage'], count: 6 },
  Halkyone: { descriptions: ['E-commerce product catalog','Shopping cart interface','Checkout flow step one','User authentication screen','Order history page','Product detail view','Category filter sidebar','Search results page','Account settings panel','Wishlist management','Payment method setup','Address book interface','Email notification settings','Mobile responsive header','Footer navigation design','Promotional banner area','Featured products section','New arrival showcase','Best sellers display','Newsletter subscription form','Social media links footer','FAQ help section','Contact form interface','Size guide popup','Color variant selector','Stock availability indicator','Customer review section'], count: 28 },
  JsPlay: { descriptions: ['JavaScript playground interface','Code editor with syntax highlighting','Output console display','Library import selector','Share functionality','Preset templates gallery'], count: 4 },
  NexPoint: { descriptions: ['SaaS dashboard overview','Analytics metrics display','User management interface','API integration settings','Billing subscription page','Notification preferences','Team collaboration view','Project workspace layout','File upload interface','Data visualization charts','Export functionality','Search and filter bar','Mobile app preview','Settings configuration','Audit log viewer','Security settings panel'], count: 17 },
  OppStack: { descriptions: ['Opportunity pipeline view','Deal details interface','Contact management screen','Activity timeline display','Quote generation form','Win/loss analysis chart'], count: 3 },
  SmashElite: { descriptions: ['Gaming leaderboard interface','Player profile card design','Match history display','Tournament bracket view','Team roster management','Stats comparison panel','Achievement unlock screen','Skill rating display','Game mode selection','Character selection screen','Map vote interface','Lobby waiting room','Spectator mode view','Replay review interface','Settings configuration panel','Audio controls display','Video settings options','Keybind configuration','Controller mapping screen','Notification toast design'], count: 20 }
}

const PROJECT_ORDER = ['Halkyone', 'NexPoint', 'CloudPallet', 'SmashElite', 'Dev2ndBrain', 'OppStack', 'JsPlay']
const IMAGES_PER_PAGE = 10

function buildGalleryImages(): GalleryImage[] {
  const images: GalleryImage[] = []
  PROJECT_ORDER.forEach(project => {
    const info = PROJECTS[project]
    for (let i = 1; i <= info.count; i++) {
      images.push({
        id: `${project.toLowerCase()}-${i}`,
        src: `/gallery/${project}/${i}.png`,
        alt: info.descriptions[(i - 1) % info.descriptions.length],
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
    setLightboxIndex(prev => prev !== null ? (prev + 1) % paginatedImages.length : null)
  }, [paginatedImages.length])

  const handlePrev = useCallback(() => {
    setLightboxIndex(prev => prev !== null ? (prev - 1 + paginatedImages.length) % paginatedImages.length : null)
  }, [paginatedImages.length])

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

  const currentLightboxImage = lightboxIndex !== null ? paginatedImages[lightboxIndex] : null

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 auto-rows-[100px] md:auto-rows-[130px] grid-flow-dense">
              {paginatedImages.map((image, index) => {
                // Generate a stable pseudo-random number based on the image ID to determine size
                const hash = image.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                const isFeatured = hash % 7 === 0
                const isWide = hash % 5 === 0 && !isFeatured
                const isTall = hash % 8 === 0 && !isFeatured && !isWide
                
                return (
                <div
                  key={image.id}
                  className={`relative rounded-xl overflow-hidden cursor-pointer group border bg-[var(--bg-section)] shadow-md hover:shadow-xl hover:-translate-y-1 hover:z-10 transition-all duration-500
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
                  onClick={() => setLightboxIndex(index)}
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
            className="fixed inset-0 z-[999999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.97)' }}
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 rounded text-sm font-semibold text-black bg-white">
                  {currentLightboxImage.project}
                </span>
                <span className="text-sm font-mono text-white/80">
                  {lightboxIndex! + 1} / {paginatedImages.length}
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
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center pointer-events-none">
                <p className="text-lg text-white font-medium drop-shadow-md text-center max-w-3xl">
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