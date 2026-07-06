import { motion, useScroll, useSpring } from "framer-motion"

interface ScrollProgressProps {
  visible?: boolean
}

export default function ScrollProgress({ visible = true }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  if (!visible) return null

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 origin-left z-[80]"
      style={{
        scaleX,
        background: "var(--accent)",
        boxShadow: "0 0 10px var(--accent)",
      }}
      aria-hidden="true"
    />
  )
}
