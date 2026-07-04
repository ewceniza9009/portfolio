import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticWrapperProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export default function MagneticWrapper({ 
  children, 
  className = "", 
  strength = 0.8 // Increased strength for a much more obvious effect
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 10, stiffness: 100, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    x.set(distanceX * strength);
    y.set(distanceY * strength);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        x: springX,
        y: springY,
        display: "inline-block",
        position: "relative",
        zIndex: isHovered ? 10 : 1
      }}
      className={className}
    >
      {/* Invisible expanded hit area to trigger the pull before the mouse touches the button itself */}
      <div className="absolute -inset-6 z-0 rounded-full" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
