
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface LandingHeroProps {
  openVideoModal: () => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function LandingHero({ openVideoModal }: LandingHeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {/* Stats Badge */}
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-surface-elevated border border-border px-6 py-2 mb-8">
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-text-secondary">📊 $140B sent annually to Caribbean</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 variants={fadeInUp} className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            Send. Save. Grow.
            <br />
            <span className="bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent animate-gradient-xy">
              The Next Generation
            </span>
            <br />
            of Caribbean Remittance.
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto mb-12 leading-relaxed">
            Turn every remittance into wealth creation — earn yield, invest in real assets, and access credit while sending money home.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/home"
              className="rounded-xl bg-primary hover:bg-[#CC0049] text-white px-8 py-4 text-lg font-semibold transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,0,92,0.6)] hover:scale-105 flex items-center gap-2"
            >
              Join 5,000+ on Waitlist
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <button
              onClick={openVideoModal}
              className="rounded-xl bg-surface-elevated hover:bg-border border border-border-hover text-white px-8 py-4 text-lg font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Watch Demo (2 min)
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
    </section>
  );
}

