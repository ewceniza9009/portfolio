import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const frameRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (frameRef.current) return
      frameRef.current = requestAnimationFrame(() => {
        setIsVisible(window.scrollY > 400)
        frameRef.current = 0
      })
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frameRef.current)
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed right-6 z-50 p-3 rounded-full shadow-[0_0_20px_var(--accent-dim)] transition-colors hover:scale-110"
          style={{ 
            background: 'var(--accent)', 
            color: 'var(--bg-primary)',
            bottom: '4.5rem',
          }}
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
