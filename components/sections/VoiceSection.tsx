"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../animations/animationVariants";
import { VoiceWaveform } from "../animations/VoiceWaveform";

export const VoiceSection: React.FC = () => {
  return (
    <section id="voice" className="py-24 px-4 bg-background relative overflow-hidden">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto text-center"
      >
        {/* Title */}
        <motion.h2
          variants={fadeInUp}
          className="text-5xl md:text-6xl font-bold mb-6"
        >
          Speak to Your Money
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          variants={fadeInUp}
          className="text-xl text-text-secondary max-w-3xl mx-auto mb-12"
        >
          StablePago’s <span className="text-primary font-semibold">Voice AI</span> 
          lets anyone send, request, or check remittances by simply speaking — in English, Spanish, or Creole.
        </motion.p>

        {/* Waveform */}
        <motion.div
          variants={fadeInUp}
          className="flex justify-center mb-16"
        >
          <VoiceWaveform active />
        </motion.div>

        {/* Example Commands */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        >
          {[
            {
              icon: "🎙️",
              text: `"Send $20 to Mami in Santo Domingo."`,
            },
            {
              icon: "📊",
              text: `"Check my wallet balance."`,
            },
            {
              icon: "🏦",
              text: `"Withdraw $50 to my Banco Popular account."`,
            },
          ].map((cmd, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              <div className="text-3xl mb-3">{cmd.icon}</div>
              <p className="text-lg text-text-secondary italic">{cmd.text}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={fadeInUp}
          className="mt-16 flex justify-center"
        >
          <a
            href="#waitlist"
            className="btn-primary px-8 py-4 text-lg font-semibold"
          >
            Try Voice AI (Beta)
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};
