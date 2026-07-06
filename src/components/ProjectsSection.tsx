import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink, Play, Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  SiDotnet,
  SiReact,
  SiAngular,
  SiBlazor,
  SiFlutter,
  SiDocker,
  SiPostgresql,
  SiMongodb,
  SiRedis,
  SiOpencv,
  SiPython,
} from "react-icons/si";

const techIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  "ASP.NET Core": SiDotnet,
  "ASP.NET Core 9": SiDotnet,
  "ASP.NET Core 10": SiDotnet,
  "ASP.NET MVC": SiDotnet,
  "Blazor.NET": SiBlazor,
  "MAUI.NET": SiDotnet,
  ".NET 9": SiDotnet,
  ".NET MAUI": SiDotnet,
  React: SiReact,
  "Angular 20": SiAngular,
  Flutter: SiFlutter,
  Docker: SiDocker,
  PostgreSQL: SiPostgresql,
  MongoDB: SiMongodb,
  Redis: SiRedis,
  OpenCV: SiOpencv,
  Python: SiPython,
  "EF Core 9": SiDotnet,
  "Entity Framework": SiDotnet,
};

function TechIcon({ name }: { name: string }) {
  const Icon = techIcons[name];
  return Icon ? <Icon size={12} /> : null;
}

function ImageWithFallback({
  src,
  alt,
  fallback,
  className,
}: {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
}) {
  const [error, setError] = useState(0);
  const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const [imgSrc, setImgSrc] = useState(webpSrc);

  useEffect(() => {
    setImgSrc(webpSrc);
    setError(0);
  }, [src]);

  const getSrc = () => {
    if (error === 0) return imgSrc;
    if (error === 1) return src;
    if (error === 2 && fallback) return fallback.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    if (error === 3 && fallback) return fallback;
    return imgSrc;
  };

  return (
    <img
      src={getSrc()}
      alt={alt}
      className={className}
      onError={() => setError(e => e + 1)}
      loading="lazy"
    />
  );
}

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
  display_order?: number;
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
}

interface ProjectsSectionProps {
  projects: Project[];
  onSelectProject: (id: number) => void;
}

// 3D tilt hook
function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  }, [ref]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!rectRef.current) return;
      const rect = rectRef.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      setTilt({ rotateX, rotateY });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return { tilt, handleMouseEnter, handleMouseMove, handleMouseLeave };
}

const ProjectCard = React.memo(function ProjectCard({
  project,
  index,
  onSelectProject,
}: {
  project: Project;
  index: number;
  onSelectProject: (id: number) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { tilt, handleMouseEnter, handleMouseMove, handleMouseLeave } = useTilt(cardRef);
  const hiddenTechCount = project.tech.length - 3;
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isHovered) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    // Only tilt on desktop with fine pointer, and respect reduced-motion
    const mqPointer = window.matchMedia("(pointer: fine)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mqPointer.matches || mqMotion.matches) return;

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseEnter, handleMouseMove, handleMouseLeave]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08 }}
      className="project-card group rounded-2xl border overflow-hidden cursor-pointer"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition:
          "transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease",
      }}
      onClick={() => onSelectProject(project.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <motion.div
        layoutId={`project-image-${project.id}`}
        className="relative h-48 overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
      >
        <ImageWithFallback
          src={project.image}
          alt={project.title}
          fallback={project.fallback}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent z-10" />

        {project.video && (
          <video
            ref={videoRef}
            src={project.video}
            poster={project.image}
            preload="none"
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-10 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Year badge */}
        <span
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium font-mono z-20"
          style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
        >
          {project.year}
        </span>

        {/* Type badge */}
        <span
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium z-20"
          style={{
            background:
              project.type === "Emerging"
                ? "var(--accent-secondary)"
                : "var(--bg-card)",
            color:
              project.type === "Emerging" ? "#fff" : "var(--text-secondary)",
            border:
              project.type === "Emerging" ? "none" : "1px solid var(--border)",
          }}
        >
          {project.type}
        </span>

        {/* Video badge */}
        {project.video && (
          <span className="absolute bottom-3 right-3 video-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-white z-20">
            <Play size={10} fill="currentColor" /> Video
          </span>
        )}
      </motion.div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-1">{project.title}</h3>
        <p
          className="text-sm mb-3"
          style={{ color: "var(--accent-secondary)" }}
        >
          {project.subtitle}
        </p>
        <p
          className="text-sm mb-4 line-clamp-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {project.description}
        </p>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="tag-neutral inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
            >
              <TechIcon name={tech} />
              {tech}
            </span>
          ))}
          {hiddenTechCount > 0 && (
            <span className="tag-secondary inline-flex items-center px-2 py-1 rounded text-xs font-medium">
              +{hiddenTechCount} more
            </span>
          )}
        </div>

        {/* Quick access links */}
        <div className="flex gap-2">
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
              }}
            >
              <Github size={13} />
              Repo
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                background: "var(--accent-secondary-dim)",
                color: "var(--accent-secondary)",
              }}
            >
              <ExternalLink size={13} />
              Live App
            </a>
          )}
        </div>

        {/* Testimonial */}
        {project.testimonial && (
          <div
            className="mt-4 pt-4 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <p
              className="text-xs italic mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              "{project.testimonial.quote}"
            </p>
            <p
              className="text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              - {project.testimonial.author}, {project.testimonial.role}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
})

export default function ProjectsSection({
  projects,
  onSelectProject,
}: ProjectsSectionProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFilter = searchParams.get('filter') || 'all'
  const [filter, setFilter] = useState(initialFilter)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const isFirstWriteRef = useRef(true)

  useEffect(() => {
    if (isFirstWriteRef.current) {
      isFirstWriteRef.current = false
      return
    }
    const next = new URLSearchParams()
    if (filter && filter !== 'all') next.set('filter', filter)
    if (search.trim()) next.set('q', search.trim())
    setSearchParams(next, { replace: true })
  }, [filter, search, setSearchParams])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        project.tech.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (filter === "all") return true;
      if (filter === "commercial") return project.type === "Commercialized";
      if (filter === "saas")
        return ["Full-Stack SaaS", "Deployed", "Microservices"].includes(
          project.type
        );
      if (filter === "emerging") return project.type === "Emerging";
      return true;
    }).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [filter, search, projects]);

  return (
    <section
      id="projects"
      className="py-32 px-6"
      style={{ background: "var(--bg-section)" }}
    >
      {/* Section divider */}
      <div className="section-divider max-w-6xl mx-auto mb-32" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold mb-2 font-display"
            >
              Projects
            </motion.h2>
            <p style={{ color: "var(--text-secondary)" }}>Featured work</p>
          </div>

          {/* Search bar & filter wrapper */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-sm transition-all duration-300 contact-input"
                style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm p-0.5 rounded-full hover:bg-[var(--accent-dim)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border"
                    style={{
                      background: isActive
                        ? "var(--accent)"
                        : "var(--bg-card)",
                      color: isActive ? "var(--bg-primary)" : "var(--text-secondary)",
                      borderColor: isActive ? "var(--accent)" : "var(--border)",
                      boxShadow: isActive ? "0 2px 8px var(--accent-dim)" : "none",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div
            className="text-center py-20 border rounded-2xl border-dashed"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
          >
            <p
              className="text-xl font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              No matching projects found
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Try adjusting your search keywords or active filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onSelectProject={onSelectProject}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const filterTabs = [
  { id: "all", label: "All Projects" },
  { id: "commercial", label: "Commercial ERP" },
  { id: "saas", label: "SaaS & Cloud" },
  { id: "emerging", label: "Emerging Tech" },
];

// Re-export utilities for the modal
export { TechIcon, ImageWithFallback };
