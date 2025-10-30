"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../animations/animationVariants";
import { StatCard } from "../ui/StatCard";

export const CaribbeanSection: React.FC = () => {
  return (
    <section
      id="caribbean"
      className="py-24 px-4 bg-background relative overflow-hidden border-t border-border"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-5xl md:text-6xl font-bold mb-6"
        >
          Built for the Caribbean
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="text-xl text-text-secondary max-w-3xl mx-auto mb-16"
        >
          StablePago connects diasporas and island families through fast, compliant, and affordable remittances — starting with{" "}
          <span className="text-primary font-semibold">Puerto Rico</span>,{" "}
          <span className="text-secondary font-semibold">Dominican Republic</span>, and{" "}
          <span className="text-success font-semibold">Haiti</span>.
        </motion.p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <StatCard
            stat={{
              value: 140,
              label: "Billion sent annually to the Caribbean",
              color: "primary",
              icon: "💸",
              context: "A region where remittances power everyday life.",
            }}
          />
          <StatCard
            stat={{
              value: 78,
              label: "of recipients are unbanked or underbanked",
              color: "error",
              icon: "📉",
              context: "A major opportunity for inclusive fintech.",
            }}
            delay={0.2}
          />
          <StatCard
            stat={{
              value: 12,
              label: "million active senders across the diaspora",
              color: "secondary",
              icon: "🌎",
              context: "Primarily in the US, Spain, and Canada.",
            }}
            delay={0.4}
          />
        </div>

        {/* Map Illustration Placeholder */}
        <motion.div
          variants={fadeInUp}
          className="relative max-w-4xl mx-auto"
        >
          <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-success/10 p-1 shadow-lg">
            <div className="rounded-3xl bg-background p-8">
              <p className="text-lg text-text-secondary">
                🌍 Imagine a connected Caribbean — where funds move as freely as messages, 
                and every transfer builds shared prosperity.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
