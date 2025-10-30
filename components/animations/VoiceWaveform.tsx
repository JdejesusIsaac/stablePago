"use client";

import { motion } from "framer-motion";

/**
 * Animated voice waveform visualization for active speech simulation.
 */
export const VoiceWaveform = ({ active }: { active: boolean }) => (
  <div className="flex items-center justify-center gap-2 h-24">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-1 bg-gradient-to-t from-secondary to-primary rounded-full"
        animate={
          active
            ? { height: [20, 40 + Math.random() * 40, 20] }
            : { height: 20 }
        }
        transition={{
          duration: 0.5 + Math.random() * 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          delay: i * 0.05,
        }}
      />
    ))}
  </div>
);
