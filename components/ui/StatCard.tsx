"use client";

import { motion } from "framer-motion";

interface Stat {
  value: number;
  label: string;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  icon?: string;
  context?: string;
}

interface StatCardProps {
  stat: Stat;
  delay?: number;
}

/**
 * Clean animated statistic card for numeric data or impact metrics.
 */
export const StatCard: React.FC<StatCardProps> = ({ stat, delay = 0 }) => {
  const colorClass =
    stat.color === "primary"
      ? "text-primary"
      : stat.color === "secondary"
      ? "text-secondary"
      : stat.color === "success"
      ? "text-success"
      : stat.color === "warning"
      ? "text-warning"
      : stat.color === "error"
      ? "text-error"
      : "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-surface border border-border p-8 text-center shadow-sm"
    >
      <div className={`text-4xl font-bold mb-2 ${colorClass}`}>
        {stat.icon && <span className="mr-2">{stat.icon}</span>}
        {stat.value}%
      </div>
      <p className="text-lg font-medium text-foreground mb-2">{stat.label}</p>
      {stat.context && (
        <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
          {stat.context}
        </p>
      )}
    </motion.div>
  );
};
