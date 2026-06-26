import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink, Play } from "lucide-react";
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
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
    setError(false);
  }, [src]);

  return (
    <img
      src={error && fallback ? fallback : imgSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      setTilt({ rotateX, rotateY });
    },
    [ref],
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return { tilt, handleMouseMove, handleMouseLeave };
}

function ProjectCard({
  project,
  index,
  onSelectProject,
}: {
  project: Project;
  index: number;
  onSelectProject: (id: number) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { tilt, handleMouseMove, handleMouseLeave } = useTilt(cardRef);
  const hiddenTechCount = project.tech.length - 3;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    // Only tilt on desktop with fine pointer, and respect reduced-motion
    const mqPointer = window.matchMedia("(pointer: fine)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mqPointer.matches || mqMotion.matches) return;

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
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
    >
      {/* Image */}
      <div
        className="relative h-48 overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
      >
        <ImageWithFallback
          src={project.image}
          alt={project.title}
          fallback={project.fallback}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />

        {/* Year badge */}
        <span
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium font-mono"
          style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
        >
          {project.year}
        </span>

        {/* Type badge */}
        <span
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium"
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
          <span className="absolute bottom-3 right-3 video-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-white">
            <Play size={10} fill="currentColor" /> Video
          </span>
        )}
      </div>

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
}

export default function ProjectsSection({
  projects,
  onSelectProject,
}: ProjectsSectionProps) {
  return (
    <section
      id="projects"
      className="py-32 px-6"
      style={{ background: "var(--bg-section)" }}
    >
      {/* Section divider */}
      <div className="section-divider max-w-6xl mx-auto mb-32" />

      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-2 font-display"
        >
          Projects
        </motion.h2>
        <p className="mb-16" style={{ color: "var(--text-secondary)" }}>
          Featured work
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onSelectProject={onSelectProject}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Re-export utilities for the modal
export { TechIcon, ImageWithFallback };
