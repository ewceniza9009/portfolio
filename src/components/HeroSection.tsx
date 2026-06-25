import { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Github, Linkedin, ChevronDown, ArrowRight } from "lucide-react";

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
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const typedRole = useTypewriter(ROLES);

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center px-6 pt-20 bg-[var(--bg-section)] relative overflow-hidden"
    >
      {/* Floating decorative orbs */}
      <div
        className="floating-orb floating-orb-1"
        style={{
          width: 300,
          height: 300,
          top: "10%",
          left: "5%",
          background:
            "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
        }}
      />
      <div
        className="floating-orb floating-orb-2"
        style={{
          width: 250,
          height: 250,
          top: "60%",
          right: "8%",
          background:
            "radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)",
        }}
      />
      <div
        className="floating-orb floating-orb-3"
        style={{
          width: 200,
          height: 200,
          bottom: "15%",
          left: "30%",
          background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
        }}
      />

      <motion.div
        style={{ opacity, scale }}
        className="text-center max-w-4xl relative z-10"
      >
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
              className="w-40 h-40 mx-auto rounded-full object-cover profile-ring"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </motion.div>

          {/* Name */}
          <h1 className="text-7xl md:text-8xl font-normal mb-4 font-signature">
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
          <p className="text-sm font-mono tracking-wider uppercase mb-8 shimmer-text">
            10+ Years · ERP · AI · SaaS
          </p>

          {/* Value proposition */}
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-text-secondary">
            Architecting secure, scalable enterprise systems, from financial
            platforms and warehouse management to AI-powered HR solutions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="https://github.com/ewceniza9009"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 bg-accent text-bg-primary"
            >
              <Github size={18} /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/erwin-wilson-ceniza-1b42ba32"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold border transition-all flex items-center gap-2 hover:scale-105 border-accent text-accent"
            >
              <Linkedin size={18} /> LinkedIn
            </a>
            <button
              onClick={() => onScrollTo("projects")}
              className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105"
              style={{ background: "var(--accent-secondary)", color: "#fff" }}
            >
              View Projects <ArrowRight size={18} />
            </button>
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
