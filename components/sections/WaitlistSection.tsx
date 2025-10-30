"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../animations/animationVariants";

export const WaitlistSection: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: Connect to Supabase or mailing list API endpoint
    setSubmitted(true);
    setTimeout(() => setEmail(""), 500);
  };

  return (
    <section
      id="waitlist"
      className="py-24 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5 border-t border-border"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-5xl md:text-6xl font-bold mb-6"
        >
          Join the Waitlist
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="text-lg text-text-secondary max-w-2xl mx-auto mb-12"
        >
          Be the first to access instant, voice-powered remittances across the Caribbean.  
          Early adopters get lifetime fee discounts and beta access to new features.
        </motion.p>

        {/* Waitlist Form */}
        <motion.form
          variants={fadeInUp}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full sm:w-auto flex-1 rounded-full border border-border px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
            required
          />
          <button
            type="submit"
            className="btn-primary px-8 py-4 text-lg font-semibold rounded-full"
          >
            {submitted ? "✅ Joined!" : "Join Waitlist"}
          </button>
        </motion.form>

        {/* Social Proof */}
        <motion.p
          variants={fadeInUp}
          className="text-sm text-text-muted"
        >
          🚀 Over <span className="font-semibold text-primary">5,000+</span> people have joined already!
        </motion.p>
      </motion.div>
    </section>
  );
};
