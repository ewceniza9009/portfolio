import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Github, ExternalLink } from "lucide-react";
import { TechIcon } from "./ProjectsSection";

interface Project {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  tech: string[];
  year: string;
  type: string;
  color: string;
  repo: string | null;
  demo: string | null;
  video: string | null;
  image: string;
  fallback: string;
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
}

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const showFullscreenRef = useRef(showFullscreen);
  showFullscreenRef.current = showFullscreen;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showFullscreenRef.current) setShowFullscreen(false);
        else onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (project) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setIsZoomed(false);
      setShowFullscreen(false);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [project, handleKeyDown]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col justify-end lg:justify-center lg:items-center"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Project details: ${project.title}`}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full h-full lg:h-[90vh] lg:w-[95vw] lg:max-w-7xl lg:rounded-2xl flex flex-col lg:flex-row overflow-hidden shadow-2xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Panel (Left on Desktop, Top on Mobile) */}
            <motion.div 
              layoutId={`project-image-${project.id}`}
              className={`relative w-full lg:w-1/2 h-[40vh] lg:h-full flex-shrink-0 flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r ${
                project.video ? "p-0 lg:p-12" : "p-0"
              }`}
              style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
            >
              {/* Tech doodles background */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                style={{ opacity: 0.25 }}
                viewBox="0 0 400 600"
                preserveAspectRatio="xMidYMid slice"
              >
                {/* Grid dots */}
                <pattern id="projectModalDots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="var(--accent)" opacity="0.6" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#projectModalDots)" />

                {/* Angle brackets */}
                <text x="40" y="80" fontSize="48" fontFamily="monospace" fontWeight="700" fill="var(--accent)" opacity="0.8">&lt;/&gt;</text>
                <text x="280" y="140" fontSize="36" fontFamily="monospace" fontWeight="700" fill="var(--accent-secondary)" opacity="0.7">{"{"} {"}"}</text>
                <text x="60" y="320" fontSize="28" fontFamily="monospace" fill="var(--accent)" opacity="0.6">const</text>
                <text x="300" y="420" fontSize="32" fontFamily="monospace" fontWeight="700" fill="var(--accent-secondary)" opacity="0.65">=&gt;</text>
                <text x="80" y="520" fontSize="24" fontFamily="monospace" fill="var(--accent)" opacity="0.55">async</text>

                {/* Horizontal connector lines */}
                <line x1="120" y1="85" x2="200" y2="85" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
                <line x1="100" y1="200" x2="150" y2="200" stroke="var(--accent-secondary)" strokeWidth="1" opacity="0.6" />
                <line x1="250" y1="350" x2="330" y2="350" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />

                {/* Floating circles */}
                <circle cx="350" cy="60" r="6" fill="var(--accent)" opacity="0.7" />
                <circle cx="50" cy="420" r="8" fill="var(--accent-secondary)" opacity="0.6" />
                <circle cx="320" cy="530" r="5" fill="var(--accent)" opacity="0.8" />

                {/* Decorative small plus signs */}
                <text x="200" y="480" fontSize="20" fontFamily="monospace" fill="var(--accent)" opacity="0.6">+</text>
                <text x="340" y="280" fontSize="18" fontFamily="monospace" fill="var(--accent-secondary)" opacity="0.55">*</text>
                <text x="100" y="580" fontSize="16" fontFamily="monospace" fill="var(--accent)" opacity="0.5">#</text>
              </svg>
              {project.video ? (
                <>
                  {/* Ambient blurred background using the project image to fill the void */}
                  <div 
                    className="absolute inset-0 opacity-30 blur-3xl scale-110 transition-opacity duration-1000"
                    style={{
                      backgroundImage: `url(${project.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  {/* Subtle overlay to ensure the video pops */}
                  <div className="absolute inset-0 bg-[var(--bg-card)]/50" />

                  {/* Constrained 16:9 wrapper with subtle hover float */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full lg:h-auto lg:aspect-video lg:rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center z-10 border border-white/5"
                  >
                    {project.video.includes("youtube.com") || project.video.includes("youtu.be") ? (
                      <iframe
                        src={project.video
                          .replace("watch?v=", "embed/")
                          .replace("&start=", "?start=")
                          .replace("&t=", "?start=")}
                        title={`Demo video for ${project.title}`}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <video
                        src={project.video}
                        controls
                        className="w-full h-full object-contain"
                        aria-label={`Demo video for ${project.title}`}
                      />
                    )}
                  </motion.div>
                </>
              ) : (
                /* Image only - with interactive zoom and hover scale */
                <div 
                  className="absolute inset-0 w-full h-full overflow-hidden cursor-pointer"
                  onClick={() => setIsZoomed(!isZoomed)}
                  title="Click to zoom in/out"
                >
                  {/* Ambient blurred background using the project image to fill the void */}
                  <div 
                    className="absolute inset-0 opacity-30 blur-3xl scale-110 transition-opacity duration-1000"
                    style={{
                      backgroundImage: `url(${project.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="absolute inset-0 bg-[var(--bg-card)]/50" />
                  
                  <motion.img
                    src={project.image}
                    alt={project.title}
                    animate={{ 
                      scale: isZoomed ? 1.05 : 1, 
                      objectFit: isZoomed ? "cover" : "contain" 
                    }}
                    whileHover={!isZoomed ? { scale: 1.05 } : {}}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full h-full relative z-10"
                  />
                  {/* Gradient overlay to ensure mobile close button is visible */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent lg:hidden pointer-events-none" />
                </div>
              )}

              {/* Fullscreen button */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowFullscreen(true) }}
                className="absolute top-4 right-[4.5rem] lg:top-3 lg:right-3 w-10 h-10 lg:w-9 lg:h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 z-20 backdrop-blur-md shadow-lg border"
                style={{ 
                  background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
                  borderColor: 'var(--border)',
                  color: 'var(--accent)'
                }}
                aria-label="View fullscreen"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lg:w-4 lg:h-4">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>

              {/* Mobile Close Button (Frosted Glass) */}
              <button
                onClick={onClose}
                className="lg:hidden absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10 backdrop-blur-md bg-white/20 text-white shadow-lg border border-white/20"
                aria-label="Close project details"
              >
                <X size={20} />
              </button>

              {/* Mobile Seamless Gradient Transition */}
              <div 
                className="lg:hidden absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                style={{ background: 'linear-gradient(to top, var(--bg-secondary), transparent)' }}
              />
            </motion.div>

            {/* Content Panel (Right on Desktop, Bottom on Mobile) */}
            <div className="w-full lg:w-1/2 flex-1 lg:flex-none lg:h-full flex flex-col relative min-h-0" style={{ background: "var(--bg-secondary)" }}>
              {/* Desktop Close Button */}
              <button
                onClick={onClose}
                className="hidden lg:flex absolute top-6 right-6 w-10 h-10 rounded-full items-center justify-center border transition-all hover:scale-110 z-10"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)"
                }}
                aria-label="Close project details"
              >
                <X size={20} />
              </button>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-12 lg:pr-24">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold font-display mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--accent-secondary)" }}>
                    {project.subtitle}
                  </p>
                  
                  {/* Tags aligned properly below subtitle */}
                  <div className="flex items-center gap-2 flex-wrap mb-6">
                    <span
                      className="font-mono text-sm px-3 py-1 rounded-full"
                      style={{
                        background: "var(--accent)",
                        color: "var(--bg-primary)",
                      }}
                    >
                      {project.year}
                    </span>
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background:
                          project.type === "Emerging"
                            ? "var(--accent-secondary-dim)"
                            : "var(--accent-dim)",
                        color:
                          project.type === "Emerging"
                            ? "var(--accent-secondary)"
                            : "var(--accent)",
                      }}
                    >
                      {project.type}
                    </span>
                  </div>
                </div>

                <p
                  className="mb-8 leading-relaxed text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {project.description}
                </p>

                {/* Testimonial */}
                {project.testimonial && (
                  <div
                    className="mb-8 p-5 rounded-xl border-l-4"
                    style={{
                      background: "var(--bg-card)",
                      borderColor: "var(--accent)",
                    }}
                  >
                    <p
                      className="text-sm italic mb-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      "{project.testimonial.quote}"
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--accent)" }}
                    >
                      - {project.testimonial.author}, {project.testimonial.role}
                    </p>
                  </div>
                )}

                {/* Detailed features */}
                {project.details && project.details.length > 0 && (
                  <div className="mb-8">
                    <h4
                      className="text-sm font-semibold mb-4 uppercase tracking-wider"
                      style={{ color: "var(--accent)" }}
                    >
                      Key Features
                    </h4>
                    <ul className="space-y-4">
                      {project.details.map((detail, i) => {
                        const parts = detail.split(/\*\*(.*?)\*\*/g);
                        return (
                          <li
                            key={i}
                            className="flex gap-4 text-sm leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <span
                              className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: "var(--accent)" }}
                            />
                            <span>
                              {parts.map((part, j) =>
                                j % 2 === 1 ? (
                                  <strong
                                    key={j}
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {part}
                                  </strong>
                                ) : (
                                  <span key={j}>{part}</span>
                                ),
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div>
                  <h4
                    className="text-sm font-semibold mb-4 uppercase tracking-wider"
                    style={{ color: "var(--accent)" }}
                  >
                    Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="tag-neutral inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[var(--accent-dim)]"
                        style={{ border: "1px solid var(--border)" }}
                      >
                        <TechIcon name={tech} />
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compact Sticky bottom bar */}
              {(project.repo || project.demo) && (
                <div
                  className="flex flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t flex-shrink-0"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  {project.repo && (
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all hover:scale-105"
                      style={{
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)"
                      }}
                    >
                      <Github size={16} className="sm:w-[18px] sm:h-[18px]" /> Repository
                    </a>
                  )}
                  {project.demo && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all hover:scale-105"
                      style={{
                        background: "var(--accent)",
                        color: "var(--bg-primary)",
                      }}
                    >
                      <ExternalLink size={16} className="sm:w-[18px] sm:h-[18px]" /> Live App
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Fullscreen image viewer */}
      {showFullscreen && project && (
        <motion.div
          key="fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setShowFullscreen(false)}
        >
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
            aria-label="Close fullscreen view"
          >
            <X size={24} />
          </button>
          <motion.img
            src={project.image}
            alt={project.title}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="max-w-[95vw] max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
