import { motion, useInView } from "framer-motion";
import React, { useRef } from "react";

export default React.memo(function AboutSection() {
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
          className="bg-glow-blob absolute top-[20%] -left-[10%] w-[30%] h-[40%] rounded-full blur-[100px]"
          style={{ background: "var(--accent)" }}
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
                About Me
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
              <p>
                I'm a Full Stack Software Developer with over a decade of
                experience building enterprise-grade applications, ERP systems,
                and cloud solutions. I specialize in the .NET ecosystem, React,
                and modern web technologies.
              </p>
              <p>
                Throughout my career, I've had the privilege of leading a dedicated
                team of developers and implementors to deliver impactful software
                solutions. Together, we've built everything from complex payroll and accounting
                engines to comprehensive inventory, order management, and logistics platforms
                for small to medium-sized businesses in my area.
              </p>
              <p>
                My philosophy is simple: write clean, maintainable code that
                solves real business problems. When I'm not behind a screen,
                you'll likely find me shredding as the lead guitarist of my
                band, training in Filipino Martial Arts (where I hold a degree),
                or catching up on the latest NBA games.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
})
