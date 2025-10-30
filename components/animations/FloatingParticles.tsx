"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Lightweight background animation used in hero sections.
 * Generates random particles that float with slow parallax motion.
 */
export const FloatingParticles = ({ count = 40 }: { count?: number }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid SSR mismatches
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const width = typeof window !== "undefined" ? window.innerWidth : 1920;
  const height = typeof window !== "undefined" ? window.innerHeight : 1080;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full"
          initial={{
            x: Math.random() * width,
            y: Math.random() * height,
            opacity: 0.4 + Math.random() * 0.4,
            scale: 0.6 + Math.random() * 0.8,
          }}
          animate={{
            x: Math.random() * width,
            y: Math.random() * height,
            opacity: 0.2 + Math.random() * 0.6,
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
