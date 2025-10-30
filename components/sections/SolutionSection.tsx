"use client";

import { motion } from "framer-motion";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { StatCard } from "../ui/StatCard";
import { fadeInUp, staggerContainer } from "../animations/animationVariants";

export const SolutionSection: React.FC = () => {
  return (
    <section id="solution" className="py-20 px-4 bg-surface relative overflow-hidden">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto"
      >
        <CollapsibleSection
          id="solution"
          title="Our Solution"
          subtitle="From simple transfers to sustainable growth"
          icon={<span className="text-5xl">💡</span>}
        >
          {/* Intro */}
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <p className="text-lg md:text-xl text-text-secondary max-w-4xl mx-auto">
              StablePago turns remittances into a financial foundation.  
              Each transfer automatically creates a smart wallet with tools for saving, investing, and building credit — no crypto expertise required.
            </p>
          </motion.div>

          {/* 3-Step Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            {[
              {
                step: "1️⃣",
                title: "Smart Wallet Creation",
                description:
                  "Senders and recipients each get a secure wallet instantly — no seed phrases or gas fees required.",
              },
              {
                step: "2️⃣",
                title: "Automated Savings",
                description:
                  "A portion of each remittance can be auto-directed into yield-bearing assets or local cooperatives.",
              },
              {
                step: "3️⃣",
                title: "Credit & Microloans",
                description:
                  "Savings history builds a credit profile, unlocking low-interest loans via community pools.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="bg-background border border-border rounded-2xl p-8 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-text-secondary">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard
              stat={{
                value: 45,
                label: "average savings retained per remittance",
                color: "success",
                icon: "💰",
                context: "Families save instead of spending all within 48 hours.",
              }}
            />
            <StatCard
              stat={{
                value: 60,
                label: "users converted to active investors",
                color: "primary",
                icon: "📈",
                context: "Auto-invest features build long-term wealth habits.",
              }}
              delay={0.2}
            />
            <StatCard
              stat={{
                value: 25,
                label: "qualified for microloans via proof-of-saving",
                color: "secondary",
                icon: "🏦",
                context: "Financial inclusion through data-backed creditworthiness.",
              }}
              delay={0.4}
            />
          </div>
        </CollapsibleSection>
      </motion.div>
    </section>
  );
};
