"use client";

import { motion } from "framer-motion";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { FeatureCard } from "../ui/FeatureCard";

const features = [
  {
    icon: "🔐",
    title: "Email / Social Login",
    description: "No crypto knowledge needed — onboard with Google or email.",
    stat: "99% signup success",
  },
  {
    icon: "💳",
    title: "Buy USDC with Card",
    description: "Instant funding via Crossmint Checkout.",
    stat: "Under 30 seconds",
  },
  {
    icon: "📧",
    title: "Send by Email",
    description: "Recipient doesn't need a wallet — auto-creates one on first transfer.",
    stat: "Zero friction",
  },
  {
    icon: "🏦",
    title: "Withdraw to Banks",
    description: "Direct bank deposits across Puerto Rico & Dominican Republic.",
    stat: "1-2 min settlement",
  },
  {
    icon: "📱",
    title: "Mobile Money",
    description: "MonCash (Haiti) and Orange Cash (DR) integrations for the unbanked.",
    stat: "78% unbanked reached",
  },
  {
    icon: "🎙️",
    title: "Voice Commands",
    description: "Speak naturally in English or Spanish via Telegram — no typing needed.",
    stat: "99% accuracy",
    featured: true,
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 px-4 bg-surface">
      <div className="max-w-6xl mx-auto">
        <CollapsibleSection
          id="features"
          title="Core Features"
          subtitle="Designed for simplicity, built for everyone"
          icon={<span className="text-5xl">⚡</span>}
          preview={
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                {features.slice(0, 3).map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <FeatureCard feature={feature} featured={feature.featured} />
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-6 text-text-muted text-sm">
                +{features.length - 3} more features • Voice AI • Family Delegation • Auto-Invest
              </div>
            </>
          }
        >
          {/* Full grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <FeatureCard feature={feature} featured={feature.featured} />
              </motion.div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </section>
  );
};
