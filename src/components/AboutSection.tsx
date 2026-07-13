import { motion, useInView } from "framer-motion";
import React, { useRef } from "react";

interface AboutSectionProps {
  title: string;
  paragraphs: string[];
}

export default React.memo(function AboutSection({ title, paragraphs }: AboutSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="about"
      className="py-24 px-6 relative"
      style={{ background: "var(--bg-section)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="bg-glow-blob absolute top-[20%] -left-[10%] w-[30%] h-[40%] rounded-full"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {/* Text Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 font-display">
                {title}
              </h2>
              <div
                className="h-1 w-12 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            </div>

            <div
              className="text-base md:text-lg space-y-4"
              style={{ color: "var(--text-secondary)" }}
            >
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
})
