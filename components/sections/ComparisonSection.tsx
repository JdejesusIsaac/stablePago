"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../animations/animationVariants";

export const ComparisonSection: React.FC = () => {
  const competitors = [
    {
      name: "Traditional Remittance Apps",
      speed: "2–3 Days",
      fees: "5–10%",
      savings: "0%",
      innovation: "Legacy wires only",
    },
    {
      name: "Crypto Wallets",
      speed: "Minutes",
      fees: "Low",
      savings: "Manual",
      innovation: "Requires Web3 knowledge",
    },
    {
      name: "StablePago",
      speed: "Instant",
      fees: "0–1%",
      savings: "Automatic Yield",
      innovation: "Voice AI + Smart Contracts",
      highlight: true,
    },
  ];

  return (
    <section
      id="comparison"
      className="py-24 px-4 bg-surface border-t border-border relative overflow-hidden"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-center text-5xl md:text-6xl font-bold mb-8"
        >
          Why StablePago Wins
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="text-center text-lg text-text-secondary max-w-3xl mx-auto mb-16"
        >
          We combine <span className="text-primary font-semibold">bank-grade compliance</span> 
          with <span className="text-secondary font-semibold">AI simplicity</span>, 
          so users get the best of both worlds — security and speed.
        </motion.p>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-border rounded-2xl text-center shadow-md">
            <thead>
              <tr className="bg-background text-sm uppercase tracking-wider">
                <th className="p-4 border border-border">Platform</th>
                <th className="p-4 border border-border">Transfer Speed</th>
                <th className="p-4 border border-border">Fees</th>
                <th className="p-4 border border-border">Savings Tools</th>
                <th className="p-4 border border-border">Innovation</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((row, idx) => (
                <motion.tr
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  className={`text-sm md:text-base transition-colors ${
                    row.highlight
                      ? "bg-gradient-to-r from-primary/10 to-secondary/10 font-semibold"
                      : "bg-surface"
                  }`}
                >
                  <td className="p-4 border border-border">{row.name}</td>
                  <td className="p-4 border border-border">{row.speed}</td>
                  <td className="p-4 border border-border">{row.fees}</td>
                  <td className="p-4 border border-border">{row.savings}</td>
                  <td className="p-4 border border-border">{row.innovation}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <motion.div
          variants={fadeInUp}
          className="text-center mt-12"
        >
          <a
            href="#waitlist"
            className="btn-secondary px-8 py-4 text-lg font-semibold"
          >
            Compare Full Features →
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};
