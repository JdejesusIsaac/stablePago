"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../animations/animationVariants";

export const PartnersSection: React.FC = () => {
  const partners = [
    { name: "Crossmint", logo: "/logos/crossmint.svg" },
    { name: "Polygon Labs", logo: "/logos/polygon.svg" },
    { name: "Circle", logo: "/logos/circle.svg" },
    { name: "Celo Foundation", logo: "/logos/celo.svg" },
    { name: "Dabl Club", logo: "/logos/dabl.svg" },
  ];

  return (
    <section
      id="partners"
      className="py-20 px-4 bg-surface border-t border-border relative overflow-hidden"
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
          Trusted by Leading Partners
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="text-lg text-text-secondary max-w-3xl mx-auto mb-12"
        >
          We’re building alongside top innovators in Web3, payments, and decentralized AI.
        </motion.p>

        {/* Partner Logos */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 items-center justify-center"
        >
          {partners.map((partner, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 flex items-center justify-center bg-background rounded-full border border-border p-4 mb-3">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-10 opacity-80 hover:opacity-100 transition"
                />
              </div>
              <span className="text-sm text-text-secondary">{partner.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={fadeInUp}
          className="mt-16"
        >
          <a
            href="#waitlist"
            className="btn-secondary px-8 py-4 text-lg font-semibold"
          >
            Become a Partner →
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};
