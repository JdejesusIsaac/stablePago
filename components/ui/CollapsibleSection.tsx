"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  preview?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Reusable section wrapper with collapsible content.
 * Used for “Features”, “Solution”, etc. sections to show expandable detail.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  subtitle,
  icon,
  preview,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      id={id}
      className="relative border border-border rounded-3xl bg-background/50 backdrop-blur-md overflow-hidden shadow-lg mb-16"
    >
      <div
        className="flex flex-col items-center text-center px-6 py-12 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-center mb-4">
          {icon && <div className="text-5xl mr-3">{icon}</div>}
          <h2 className="text-4xl font-bold">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            {subtitle}
          </p>
        )}

        {/* Preview or open/close hint */}
        {!isOpen && preview && (
          <div className="w-full max-w-5xl mx-auto">{preview}</div>
        )}

        <button
          type="button"
          className="mt-6 text-sm font-medium text-primary flex items-center gap-2"
        >
          {isOpen ? "Hide Details" : "Expand Details"}
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
      </div>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="border-t border-border bg-surface px-6 py-10"
          >
            <div className="max-w-6xl mx-auto">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
