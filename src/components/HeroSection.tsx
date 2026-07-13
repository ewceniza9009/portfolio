import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Github,
  Linkedin,
  ChevronDown,
  ArrowRight,
  Download,
} from "lucide-react";
import VantaBackground from "./VantaBackground";
import OptimizedImage from "./OptimizedImage";
import { useProfilePic } from "../utils/profilePic";
import MagneticWrapper from "./MagneticWrapper";

interface HeroSectionProps {
  onScrollTo: (id: string) => void;
  onViewResume?: () => void;
}

const ROLES = [
  "Full Stack Developer",
  "Enterprise Solutions Engineer",
  "AI Solutions Researcher",
  "SaaS Builder",
];

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return "Working late"
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function useTypewriter(
  words: string[],
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseTime = 2000,
) {
  const [text, setText] = useState("")
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const tick = useCallback(() => {
    const currentWord = words[wordIndex]

    if (!isDeleting) {
      setText(currentWord.substring(0, text.length + 1))
      if (text.length + 1 === currentWord.length) {
        setTimeout(() => setIsDeleting(true), pauseTime)
        return
      }
    } else {
      setText(currentWord.substring(0, text.length - 1))
      if (text.length === 0) {
        setIsDeleting(false)
        setWordIndex((prev) => (prev + 1) % words.length)
      }
    }
  }, [text, wordIndex, isDeleting, words, pauseTime])

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed
    const timer = setTimeout(tick, speed)
    return () => clearTimeout(timer)
  }, [tick, isDeleting, typingSpeed, deletingSpeed])

  return text
}

export default React.memo(function HeroSection({
  onScrollTo,
  onViewResume,
}: HeroSectionProps) {
  const typedRole = useTypewriter(ROLES);
  const greeting = React.useMemo(() => getGreeting(), []);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { url: profilePicUrl } = useProfilePic();

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center px-6 pt-20 relative"
    >
      <VantaBackground />
      {/* Soft centered fade for text readability without card edges */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bg-[var(--bg-primary)]"
        style={{
          opacity: 0.85,
          WebkitMaskImage:
            "radial-gradient(circle at center, black 15%, transparent 65%)",
          maskImage:
            "radial-gradient(circle at center, black 15%, transparent 65%)",
        }}
      />

      <motion.div className="text-center max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Profile Photo */}
          <motion.div
            className="mb-10 relative w-40 h-40 mx-auto rounded-full overflow-hidden border-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ borderColor: "var(--accent)" }}
          >
            {!imgLoaded && (
              <div className="absolute inset-0 bg-[var(--bg-secondary)] animate-pulse" />
            )}
            <OptimizedImage
              src={profilePicUrl}
              alt="Erwin Wilson Ceniza"
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              priority={true}
              quality="high"
              key={profilePicUrl}
            />
          </motion.div>

          {/* Name */}
          <span className="block text-xs font-mono uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--text-muted)' }}>
            {greeting}.
          </span>
          <h1
            className="text-5xl md:text-6xl font-normal font-signature tracking-tight"
            style={{ lineHeight: 1.3 }}
          >
            Erwin Wilson <span className="gradient-text">Ceniza</span>
          </h1>

          {/* Typewriter role */}
          <p
            className="text-lg md:text-xl font-display mt-4"
            style={{ color: "var(--text-secondary)", minHeight: "1.75em" }}
          >
            {typedRole}
            <span className="typewriter-cursor" />
          </p>

          {/* Value proposition */}
          <div className="max-w-2xl mx-auto mt-6 mb-6 text-center space-y-2">
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Ten+ years building enterprise software.
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Full stack - .NET, React, Angular, Node, Express. Whatever the
              project calls for.
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              HR systems. Finance. Logistics. Healthcare.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 mb-6 p-4 rounded-xl" style={{ background: 'rgba(var(--accent-rgb, 243, 202, 101), 0.08)', border: '1px solid rgba(var(--accent-rgb, 243, 202, 101), 0.15)' }}>
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                10+
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Years Experience
              </p>
            </div>
            <div className="w-px h-10" style={{ background: "var(--border)" }} />
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                20+
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Projects Shipped
              </p>
            </div>
            <div className="w-px h-10" style={{ background: "var(--border)" }} />
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                .NET
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Full Stack
              </p>
            </div>
          </div>

          {/* About quick intro */}
          <div className="max-w-xl mx-auto mb-6 text-center flex items-center justify-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              Available for new opportunities
            </p>
          </div>
          <div className="max-w-xl mx-auto mb-8 text-center">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Based in Cebu. Developer by day, musician by night.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <MagneticWrapper>
              <button
                onClick={() => onScrollTo("projects")}
                className="px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-[0_0_20px_var(--accent-dim)] hover:shadow-[0_0_30px_var(--accent-dim)]"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg-primary)",
                }}
              >
                View Projects <ArrowRight size={18} />
              </button>
            </MagneticWrapper>
            <MagneticWrapper>
              <button
                onClick={onViewResume}
                className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 glass hover:bg-[var(--bg-card-hover)]"
                style={{ color: "var(--text-primary)" }}
              >
                <Download size={18} /> Resume
              </button>
            </MagneticWrapper>

            <div className="flex items-center gap-3 border-l pl-4 ml-2" style={{ borderColor: 'var(--border)' }}>
              <a
                href="https://github.com/ewceniza9009"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full transition-all hover:scale-110 glass hover:bg-[var(--bg-card-hover)]"
                style={{ color: "var(--text-primary)" }}
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full transition-all hover:scale-110 glass hover:bg-[var(--bg-card-hover)]"
                style={{ color: "var(--text-primary)" }}
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16"
        >
          <button
            onClick={() => onScrollTo("experience")}
            className="animate-bounce"
            aria-label="Scroll to experience"
          >
            <ChevronDown size={32} className="text-accent" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
})
