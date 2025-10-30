"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const Footer: React.FC = () => {
  const socialLinks = [
    { label: "Twitter", href: "https://x.com/StablePago" },
    { label: "Telegram", href: "https://t.me/StablePago" },
    { label: "GitHub", href: "https://github.com/stablepago" },
  ];

  return (
    <footer className="border-t border-border bg-surface py-12 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            StablePago
          </Link>
        </motion.div>

        {/* Tagline */}
        <p className="text-text-secondary mt-3 mb-6">
          Turning remittances into generational wealth.
        </p>

        {/* Socials */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {socialLinks.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-text-muted mb-6">
          <Link href="#features" className="hover:text-primary">
            Features
          </Link>
          <Link href="#problem" className="hover:text-primary">
            Problem
          </Link>
          <Link href="#solution" className="hover:text-primary">
            Solution
          </Link>
          <Link href="#waitlist" className="hover:text-primary">
            Waitlist
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-text-muted">
          © {new Date().getFullYear()} StablePago. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
