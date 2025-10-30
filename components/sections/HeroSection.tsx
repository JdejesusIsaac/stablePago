"use client";

import { motion } from "framer-motion";
import { CountUp } from "../animations/CountUp";
import { FloatingParticles } from "../animations/FloatingParticles";

interface HeroSectionProps {
  onWaitlistClick?: () => void;
  onVideoClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onWaitlistClick,
  onVideoClick,
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 50% 20%, rgba(255, 0, 92, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 240, 255, 0.2), transparent 50%)",
          }}
        />
        <FloatingParticles count={30} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center px-4 py-32">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block mb-6 px-6 py-3 rounded-full backdrop-blur-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30"
        >
          <span className="text-sm font-semibold flex items-center gap-2">
            <svg
              className="w-4 h-4 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <CountUp end={140} prefix="$" suffix="B" /> sent annually to Caribbean
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial="hidden"
          animate="show"
          className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-6"
        >
          <motion.span className="block mb-2">Send. Save. Grow.</motion.span>
          <motion.span className="block mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-glow-pulse">
            The Next Generation
          </motion.span>
          <motion.span className="block">of Caribbean Remittance.</motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl sm:text-2xl text-text-secondary max-w-4xl mx-auto mb-12 leading-relaxed"
        >
          Turn every remittance into wealth creation — earn yield, invest in real assets, and access credit while sending money home.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            type="button"
            onClick={onWaitlistClick}
            className="group btn-primary text-lg px-10 py-4 glow-primary w-full sm:w-auto flex items-center justify-center gap-2"
          >
            Join 5,000+ on Waitlist
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>

          <button
            onClick={onVideoClick}
            className="group btn-secondary text-lg px-10 py-4 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            Watch Demo (2 min)
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
};
