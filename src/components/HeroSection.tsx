import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, ChevronDown, ArrowRight } from "lucide-react";
import VantaBackground from "./VantaBackground";

interface HeroSectionProps {
  onScrollTo: (id: string) => void;
}

const ROLES = [
  "Full Stack Developer",
  "Enterprise Solutions Engineer",
  "AI Integration",
  "SaaS Builder",
];

function useTypewriter(
  words: string[],
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseTime = 2000,
) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      setText(currentWord.substring(0, text.length + 1));
      if (text.length + 1 === currentWord.length) {
        setTimeout(() => setIsDeleting(true), pauseTime);
        return;
      }
    } else {
      setText(currentWord.substring(0, text.length - 1));
      if (text.length === 0) {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      }
    }
  }, [text, wordIndex, isDeleting, words, pauseTime]);

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting, typingSpeed, deletingSpeed]);

  return text;
}

export default function HeroSection({ onScrollTo }: HeroSectionProps) {
  const typedRole = useTypewriter(ROLES);

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
          WebkitMaskImage: "radial-gradient(circle at center, black 15%, transparent 65%)",
          maskImage: "radial-gradient(circle at center, black 15%, transparent 65%)",
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
            className="mb-10"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img
              src="/img/profile-pic.png"
              alt="Erwin Wilson Ceniza"
              className="w-40 h-40 mx-auto rounded-full object-cover border-2"
              style={{ borderColor: "var(--accent)" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </motion.div>

          {/* Name */}
          <h1 className="text-5xl md:text-6xl font-normal mb-4 font-signature">
            Erwin Wilson <span className="gradient-text">Ceniza</span>
          </h1>

          {/* Typewriter role */}
          <p
            className="text-xl md:text-2xl font-medium mb-2 font-display"
            style={{ color: "var(--text-secondary)", minHeight: "2em" }}
          >
            {typedRole}
            <span className="typewriter-cursor" />
          </p>

          {/* Value proposition */}
          <div className="text-lg max-w-2xl mx-auto mb-10 text-center text-text-secondary space-y-2">
            <p>Building enterprise software for over a decade.</p>
            <p>I work across the full stack, mostly in .NET, sometimes in Node or React, and I actually enjoy getting into complex database queries.</p>
            <p>HR systems, accounting platforms, warehouse logistics.</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
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
            <a
              href="https://github.com/ewceniza9009"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 glass hover:bg-[var(--bg-card-hover)]"
              style={{ color: "var(--text-primary)" }}
            >
              <Github size={18} /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 glass hover:bg-[var(--bg-card-hover)]"
              style={{ color: "var(--text-primary)" }}
            >
              <Linkedin size={18} /> LinkedIn
            </a>
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
}
