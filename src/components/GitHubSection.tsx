import { motion, useInView } from "framer-motion";
import { memo, useRef } from "react";
import { Github, ExternalLink, Activity, Star } from "lucide-react";
import { ACCENT_THEMES } from "../data/accents";
import type { AccentKey } from "../data/accents";

const GITHUB_USERNAME = "ewceniza9009";

interface GitHubSectionProps {
  theme?: "dark" | "light";
  accent?: AccentKey;
}

export default memo(function GitHubSection({
  theme = "dark",
  accent = "gold",
}: GitHubSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const isLight = theme === "light";

  // Extract the color hex without '#' for the contribution chart and stats widgets
  const themeSet = ACCENT_THEMES[accent]?.[theme];
  const accentColorHex = themeSet?.accent.replace("#", "") || "f3ca65";

  // Theme-aware GitHub stats parameters
  const bgColor = isLight ? "ffffff" : "181818";
  const textColor = isLight ? "475569" : "a3a3a3";
  const titleColor = accentColorHex;
  const borderHidden = "true";

  return (
    <section
      id="github"
      className="py-32 px-6 relative"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="bg-glow-blob absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[50%] rounded-full blur-[100px]"
          style={{ background: "var(--accent)" }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <div
            className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl"
            style={{ background: "var(--accent-dim)" }}
          >
            <Github size={28} style={{ color: "var(--accent)" }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 font-display">
            GitHub Activity
          </h2>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
            Active open source development and contributions
          </p>
          <a
            href={`https://github.com/${GITHUB_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <Github size={18} /> @{GITHUB_USERNAME}{" "}
            <ExternalLink size={14} className="ml-1 opacity-50" />
          </a>
        </motion.div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contribution Heatmap (Spans all 3 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ y: -5, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
            className="rounded-2xl border overflow-hidden col-span-1 md:col-span-3 flex flex-col transition-shadow"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              className="p-6 border-b flex items-center gap-2"
              style={{ borderColor: "var(--border)" }}
            >
              <Activity size={18} style={{ color: "var(--accent)" }} />
              <h3
                className="font-semibold text-sm uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                Contribution Heatmap
              </h3>
            </div>
            <div className="p-8 overflow-x-auto flex justify-center items-center w-full">
              <div className="flex justify-center w-max min-w-full">
                <img
                  src={`https://ghchart.rshah.org/${accentColorHex}/${GITHUB_USERNAME}`}
                  alt={`${GITHUB_USERNAME}'s GitHub Contributions Heatmap`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto max-h-32 object-contain"
                  style={{
                    filter:
                      theme === "dark"
                        ? "invert(0.9) hue-rotate(180deg)"
                        : "none",
                  }}
                />
              </div>
            </div>
          </motion.div>
          {/* Top Languages (Spans 2 columns on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ y: -5, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
            className="rounded-2xl border overflow-hidden md:col-span-2 flex flex-col transition-shadow"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              className="p-6 border-b flex items-center gap-2"
              style={{ borderColor: "var(--border)" }}
            >
              <Activity size={18} style={{ color: "var(--accent)" }} />
              <h3
                className="font-semibold text-sm uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                Top Languages
              </h3>
            </div>
            <div className="p-8 flex-1 flex items-center justify-center">
              <img
                src={`https://github-readme-stats-eight-theta.vercel.app/api/top-langs/?username=${GITHUB_USERNAME}&theme=transparent&hide_border=${borderHidden}&title_color=${titleColor}&text_color=${textColor}&bg_color=${bgColor}&layout=compact&langs_count=8`}
                alt="Top languages used across repositories"
                loading="lazy"
                decoding="async"
                className="w-full max-w-3xl h-full max-h-56 object-contain drop-shadow-sm"
              />
            </div>
          </motion.div>

          {/* Overall Stats (Spans 1 column on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ y: -5, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
            className="rounded-2xl border overflow-hidden flex flex-col transition-shadow"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              className="p-6 border-b flex items-center gap-2"
              style={{ borderColor: "var(--border)" }}
            >
              <Star size={18} style={{ color: "var(--accent-secondary)" }} />
              <h3
                className="font-semibold text-sm uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                Overall Stats
              </h3>
            </div>
            <div className="p-4 sm:p-6 flex-1 flex items-center justify-center">
              <img
                src={`https://github-readme-stats-eight-theta.vercel.app/api?username=${GITHUB_USERNAME}&theme=transparent&hide_border=${borderHidden}&title_color=${titleColor}&text_color=${textColor}&bg_color=${bgColor}&show_icons=true&count_private=true&hide_rank=true&custom_title=GitHub%20Stats&include_all_commits=true`}
                alt="Overall GitHub Stats"
                loading="lazy"
                decoding="async"
                className="w-full h-full max-h-56 object-contain drop-shadow-sm"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
})
