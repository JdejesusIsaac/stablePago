"use client";

import { motion } from "framer-motion";

interface Feature {
  icon: string;
  title: string;
  description: string;
  stat?: string;
}

interface FeatureCardProps {
  feature: Feature;
  featured?: boolean;
}

/**
 * Responsive card for showcasing a single feature block.
 * Supports featured highlighting via gradient and badge.
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  featured = false,
}) => (
  <motion.div
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ duration: 0.25 }}
    className={`relative group overflow-hidden rounded-2xl p-8 transition-all duration-300 ${
      featured
        ? "bg-gradient-to-br from-primary/10 via-secondary/10 to-success/10 border-2 border-primary"
        : "bg-surface border border-border"
    }`}
  >
    {/* Icon */}
    <div className="relative mb-6">
      <div
        className={`w-16 h-16 flex items-center justify-center text-3xl rounded-2xl shadow-md
        ${featured
          ? "bg-gradient-to-br from-primary to-secondary text-white"
          : "bg-gradient-to-br from-border to-surface-elevated text-primary"
        }`}
      >
        {feature.icon}
      </div>
      {featured && (
        <div className="absolute -top-2 -right-2 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow">
          Featured
        </div>
      )}
    </div>

    {/* Title */}
    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
      {feature.title}
    </h3>

    {/* Description */}
    <p className="text-text-secondary leading-relaxed mb-4">
      {feature.description}
    </p>

    {/* Optional Stat */}
    {feature.stat && (
      <div className="flex items-center gap-2 text-success font-semibold">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{feature.stat}</span>
      </div>
    )}
  </motion.div>
);
