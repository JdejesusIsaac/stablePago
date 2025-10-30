"use client";

import { motion } from "framer-motion";
import { StatCard } from "../ui/StatCard";

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-error">$140B</span> in annual remittances,
            <br />
            <span className="text-muted">$0</span> in lasting wealth.
          </h2>
          <p className="text-xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
            Caribbean families receive billions yearly, yet most funds are{" "}
            <span className="text-warning font-semibold">consumed immediately</span>,{" "}
            <span className="text-error font-semibold">eroded by inflation</span>, and{" "}
            <span className="text-error font-semibold">never build wealth</span>.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard
            stat={{
              value: 80,
              label: "of remittances spent within 48 hours",
              color: "error",
              icon: "⚠️",
              context: "Families struggle to save for emergencies",
            }}
          />
          <StatCard
            stat={{
              value: 0,
              label: "allocated to yield-bearing accounts",
              color: "warning",
              icon: "📉",
              context: "Money loses value to inflation every year",
            }}
            delay={0.2}
          />
          <StatCard
            stat={{
              value: 25,
              label: "of GDP depends on remittances",
              color: "secondary",
              icon: "🌴",
              context: "Entire economies rely on these transfers",
            }}
            delay={0.4}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30">
            <span className="text-lg font-semibold">StablePago changes this.</span>
            <button
              type="button"
              className="btn-secondary-sm"
              onClick={() => {
                const el = document.getElementById("solution");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See How →
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
