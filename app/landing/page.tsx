"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// Lazy load heavy components to improve initial page load
const VideoModal = lazy(() => import("@/components/VideoModal").then(mod => ({ default: mod.VideoModal })));

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Enhanced CountUp component
const CountUp = ({ end, duration = 2, decimals = 0, prefix = "", suffix = "" }: {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(end * progress);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// Floating particles component
const FloatingParticles = ({ count = 50 }: { count?: number }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  );
};

// Progressive Disclosure Section Component
const CollapsibleSection = ({
  id,
  title,
  subtitle,
  preview,
  children,
  defaultExpanded = false,
  icon
}: {
  id: string;
  title: string;
  subtitle?: string;
  preview: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'section_toggle', {
        section_id: id,
        action: isExpanded ? 'collapse' : 'expand'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      {/* Section Header */}
      <div className="text-center mb-8">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <h2 className="text-4xl md:text-5xl font-bold mb-4">{title}</h2>
        {subtitle && <p className="text-lg text-text-secondary max-w-2xl mx-auto">{subtitle}</p>}
      </div>

      {/* Preview (Always Visible) */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative"
        >
          {preview}
          
          {/* Gradient Fade Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </motion.div>
      )}

      {/* Expand/Collapse Button */}
      <motion.button
        onClick={toggleExpanded}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative z-10 mx-auto mt-6 flex items-center gap-3 px-8 py-4 rounded-xl font-semibold
          transition-all duration-300
          ${isExpanded 
            ? 'bg-surface-elevated border border-border hover:border-border-hover text-white' 
            : 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow-primary'
          }
        `}
      >
        {isExpanded ? (
          <>
            Show Less
            <svg className="w-5 h-5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </>
        ) : (
          <>
            See All {title}
            <svg className="w-5 h-5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-8">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Interactive Feature Card
const FeatureCard = ({ 
  feature, 
  featured = false 
}: { 
  feature: {
    icon: string;
    title: string;
    description: string;
    stat?: string;
  };
  featured?: boolean;
}) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    className={`relative group overflow-hidden rounded-2xl p-8 transition-all duration-300 ${
      featured 
        ? "bg-gradient-to-br from-primary/10 via-secondary/10 to-success/10 border-2 border-primary" 
        : "card-arc"
    }`}
  >
    {/* Animated Background Glow on Hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent blur-2xl" />
    </div>
    
    {/* Icon with 3D Effect */}
    <div className="relative mb-6">
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl
        bg-gradient-to-br shadow-2xl transform group-hover:rotate-6 transition-transform ${
        featured 
          ? "from-primary via-secondary to-primary" 
          : "from-surface-elevated to-border"
      }`}>
        {feature.icon}
      </div>
      
      {featured && (
        <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold">
          🔥 Popular
        </div>
      )}
    </div>
    
    {/* Content */}
    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors relative z-10">
      {feature.title}
    </h3>
    <p className="text-text-secondary leading-relaxed mb-4 relative z-10">
      {feature.description}
    </p>
    
    {/* Stat or Benefit */}
    {feature.stat && (
      <div className="flex items-center gap-2 text-success font-semibold relative z-10">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{feature.stat}</span>
      </div>
    )}
  </motion.div>
);

// Stat Card with animation
const StatCard = ({ 
  stat, 
  delay = 0 
}: { 
  stat: {
    value: number;
    label: string;
    color: string;
    icon: string;
    context: string;
  };
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className={`card-arc p-8 border-l-4 border-${stat.color}`}
  >
    <div className="text-4xl mb-4 text-center">{stat.icon}</div>
    <div className={`text-6xl font-bold text-${stat.color} mb-4 text-center`}>
      {stat.value}%
    </div>
    <p className="text-text-secondary text-center mb-3">{stat.label}</p>
    <p className="text-sm text-text-muted text-center">{stat.context}</p>
  </motion.div>
);

// Voice Waveform Animation
const VoiceWaveform = ({ active }: { active: boolean }) => (
  <div className="flex items-center justify-center gap-2 h-24">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1 bg-gradient-to-t from-secondary to-primary rounded-full"
        animate={active ? {
          height: [20, 40 + Math.random() * 40, 20],
        } : {
          height: 20
        }}
        transition={{
          duration: 0.5 + Math.random() * 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          delay: i * 0.05,
        }}
      />
    ))}
  </div>
);

export default function EnhancedLandingPage() {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [isExistingMember, setIsExistingMember] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [utmParams, setUtmParams] = useState({ source: "", medium: "", campaign: "" });
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Passive Wealth");
  const [selectedCountry, setSelectedCountry] = useState("PR");
  const [isSimulating, setIsSimulating] = useState(false);
  const [response, setResponse] = useState("");

  const handleSectionNavigation = (sectionId: string) => {
    if (typeof window === "undefined") return;

    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.history.replaceState(null, "", window.location.pathname);
    setMobileMenuOpen(false);
  };

  // Clean up hash fragments on page load to prevent back button issues
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      // Remove hash from URL without triggering a page reload
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      source: params.get("utm_source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
    });
    const refParam = params.get("ref") || params.get("referral");
    setReferralCode(refParam ? refParam : null);
  }, []);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Video modal handlers
  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    setWaitlistPosition(null);
    setIsExistingMember(false);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const payload = {
        email: normalizedEmail,
        country: country || undefined,
        marketingOptIn,
        signupSource: "landing_page",
        referralCode: referralCode || undefined,
        utmSource: utmParams.source || undefined,
        utmMedium: utmParams.medium || undefined,
        utmCampaign: utmParams.campaign || undefined,
      };

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to join the waitlist. Please try again later.");
      }

      setSuccessMessage(result.message ?? null);
      const position = typeof result.data?.position === "number" ? result.data.position : null;
      setWaitlistPosition(position);
      setIsExistingMember(Boolean(result.data?.isExisting));
      setSubmitSuccess(true);
      setEmail("");
      setCountry("");
    } catch (error) {
      console.error("Failed to join waitlist:", error);
      setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const simulateVoiceCommand = async (cmd: any) => {
    setIsSimulating(true);
    setResponse("");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSimulating(false);
    setResponse(cmd.response);
    
    setTimeout(() => setResponse(""), 5000);
  };

  const presetCommands = [
    {
      id: 1,
      icon: "💸",
      text: "Enviar 20 USDC a mamá",
      action: "Send money to family",
      response: "Transfer complete! $20 USDC sent to María. Estimated arrival in 2 minutes."
    },
    {
      id: 2,
      icon: "💰",
      text: "Invertir $10 en ONDO",
      action: "Invest in RWA",
      response: "Investment successful! $10 allocated to ONDO. Current price: $1.32, +2.4% today."
    },
    {
      id: 3,
      icon: "📊",
      text: "Check my savings balance",
      action: "View balance",
      response: "Your USDC savings vault has $245.80. You've earned $12.40 in yield this month!"
    },
    {
      id: 4,
      icon: "💎",
      text: "What's the price of PAXG?",
      action: "Get price info",
      response: "PAXG (tokenized gold) is currently $2,645.32, up 1.8% today. Market cap: $850M."
    }
  ];

  const features = [
    {
      icon: "🔐",
      title: "Email / Social Login",
      description: "No crypto knowledge needed — onboard with Google or email.",
      stat: "99% signup success"
    },
    {
      icon: "💳",
      title: "Buy USDC with Card",
      description: "Instant funding via Crossmint Checkout.",
      stat: "Under 30 seconds"
    },
    {
      icon: "📧",
      title: "Send by Email",
      description: "Recipient doesn't need a wallet — auto-creates one on first transfer.",
      stat: "Zero friction"
    },
    {
      icon: "🏦",
      title: "Withdraw to Banks",
      description: "Direct bank deposits across Puerto Rico & Dominican Republic.",
      stat: "1-2 min settlement"
    },
    {
      icon: "📱",
      title: "Mobile Money",
      description: "MonCash (Haiti) and Orange Cash (DR) integrations for the unbanked.",
      stat: "78% unbanked reached"
    },
    {
      icon: "🎙️",
      title: "Voice Commands",
      description: "Speak naturally in English or Spanish via Telegram — no typing needed.",
      stat: "99% accuracy",
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Image src="/stablePago.png" alt="StablePago - Wealth Creation" width={50} height={50} />
              <span className="text-xl font-bold tracking-tight">StablePago</span>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-6">
              <button
                type="button"
                onClick={() => handleSectionNavigation("features")}
                className="text-text-secondary hover:text-white transition-colors"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => handleSectionNavigation("solution")}
                className="text-text-secondary hover:text-white transition-colors"
              >
                Solution
              </button>
              <button
                type="button"
                onClick={() => handleSectionNavigation("voice")}
                className="text-text-secondary hover:text-white transition-colors"
              >
                Voice AI
              </button>
              <button
                type="button"
                onClick={() => handleSectionNavigation("partners")}
                className="text-text-secondary hover:text-white transition-colors"
              >
                Partners
              </button>
              <Link href="/home" className="rounded-xl bg-primary hover:bg-[#CC0049] text-white px-6 py-2 font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,0,92,0.4)] hover:scale-[1.02]">
                Launch App
              </Link>
            </div>
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-surface-elevated border border-border hover:border-border-hover transition-colors"
            >
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-border overflow-hidden"
              >
                <div className="px-4 py-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => handleSectionNavigation("features")}
                    className="block py-2 text-left w-full text-text-secondary hover:text-white transition-colors"
                  >
                    Features
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSectionNavigation("solution")}
                    className="block py-2 text-left w-full text-text-secondary hover:text-white transition-colors"
                  >
                    Solution
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSectionNavigation("voice")}
                    className="block py-2 text-left w-full text-text-secondary hover:text-white transition-colors"
                  >
                    Voice AI
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSectionNavigation("partners")}
                    className="block py-2 text-left w-full text-text-secondary hover:text-white transition-colors"
                  >
                    Partners
                  </button>
                  <Link href="/home" className="block rounded-xl bg-primary hover:bg-[#CC0049] text-white px-6 py-3 font-semibold text-center transition-all duration-200">
                    Launch App
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* STEP 1: Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20" style={{ 
            background: 'radial-gradient(circle at 50% 20%, rgba(255, 0, 92, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 240, 255, 0.2), transparent 50%)' 
          }}></div>
          <FloatingParticles count={30} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 py-32">
          {/* Badge with Animation */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-6 px-6 py-3 rounded-full backdrop-blur-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30"
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <CountUp end={140} prefix="$" suffix="B" /> sent annually to Caribbean
            </span>
          </motion.div>
          
          {/* Headline with Stagger Animation */}
          <motion.h1 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-6"
          >
            <motion.span variants={fadeInUp} className="block mb-2">
              Send. Save. Grow.
            </motion.span>
            <motion.span variants={fadeInUp} className="block mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-glow-pulse">
              The Next Generation
            </motion.span>
            <motion.span variants={fadeInUp} className="block">
              of Caribbean Remittance.
            </motion.span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl sm:text-2xl text-text-secondary max-w-4xl mx-auto mb-12 leading-relaxed"
          >
            Turn every remittance into wealth creation — earn yield, invest in real assets, and access credit while sending money home.
          </motion.p>

          {/* CTA with Distinct Styling */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              type="button"
              onClick={() => handleSectionNavigation("waitlist")}
              className="group btn-primary text-lg px-10 py-4 glow-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              Join 5,000+ on Waitlist
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <button 
              onClick={openVideoModal}
              className="group btn-secondary text-lg px-10 py-4 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              Watch Demo (2 min)
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </motion.div>

          {/* Interactive Wealth Comparison */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="max-w-4xl mx-auto"
          >
            <div className="rounded-2xl bg-gradient-to-br from-surface-elevated to-surface border border-border overflow-hidden backdrop-blur-xl">
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="p-8 text-center">
                  <div className="text-sm text-text-muted uppercase tracking-wider mb-4">Traditional</div>
                  <div className="text-4xl mb-4">💵</div>
                  <div className="text-error font-semibold mb-2">$0 Wealth Built</div>
                  <div className="text-sm text-text-secondary">Money flows out, nothing stays</div>
                </div>
                <div className="p-8 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
                  <div className="text-sm text-text-muted uppercase tracking-wider mb-4">StablePago</div>
                  <div className="flex gap-2 justify-center text-4xl mb-4">💰🏆📈</div>
                  <div className="text-success font-semibold mb-2">
                    <CountUp end={2400} prefix="$" suffix="+" /> in 5 Years
                  </div>
                  <div className="text-sm text-text-secondary">Automatic wealth accumulation</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STEP 2: Enhanced Core Features Grid - PROGRESSIVE DISCLOSURE */}
      <section id="features" className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <CollapsibleSection
            id="features"
            title="Core Features"
            subtitle="Designed for simplicity, built for everyone"
            icon={<span className="text-5xl">⚡</span>}
            preview={
              <>
                {/* Preview: Show first 3 features only */}
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
            {/* Full Features Grid */}
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

            {/* Delegation Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="card-arc p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-l-4 border-primary"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex-shrink-0 text-3xl">
                  👵
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Family Delegation Wallets</h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-3">
                    Create controlled wallets for family members — set spending limits, enable withdrawals only, perfect for sending to grandparents.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-success">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Daily limits • Withdraw-only mode • Auto-refill</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="card-arc p-8 bg-gradient-to-br from-secondary/10 to-success/10 border-l-4 border-secondary"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-success/20 border border-secondary/30 flex-shrink-0 text-3xl">
                  🤖
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Telegram Agent Wallet</h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-3">
                    Delegate a wallet to the AI agent — it invests automatically based on your rules, DCA into RWAs, and rebalances your portfolio.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-success">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Auto-invest • Risk limits • Voice control</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

            {/* Feature Highlight Bar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/30 p-6 text-center"
            >
              <p className="text-lg font-semibold text-white mb-2">
                ✨ All features work seamlessly together — from onboarding to wealth building
              </p>
              <p className="text-sm text-text-secondary">
                Start with $1 • No minimum balance • Available 24/7 • Support in English & Spanish
              </p>
            </motion.div>
          </CollapsibleSection>
        </div>
      </section>

      {/* STEP 3: Enhanced Problem Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)'
          }}></div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <StatCard 
              stat={{
                value: 80,
                label: "of remittances spent within 48 hours",
                color: "error",
                icon: "⚠️",
                context: "Families struggle to save for emergencies"
              }}
              delay={0}
            />
            <StatCard 
              stat={{
                value: 0,
                label: "allocated to yield-bearing accounts",
                color: "warning",
                icon: "📉",
                context: "Money loses value to inflation every year"
              }}
              delay={0.2}
            />
            <StatCard 
              stat={{
                value: 25,
                label: "of GDP depends on remittances",
                color: "secondary",
                icon: "🌴",
                context: "Entire economies rely on these transfers"
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
                onClick={() => handleSectionNavigation("solution")}
                className="btn-secondary-sm"
              >
                See How →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STEP 4: Enhanced Solution Section with Tabs */}
      <section id="solution" className="py-20 px-4 bg-gradient-to-b from-surface to-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold text-center mb-4">
              From Money Transfer to Wealth Transfer
            </h2>
            <p className="text-xl text-text-secondary text-center mb-16">
              Three innovations that turn remittances into lasting prosperity
            </p>
          </motion.div>
          
          {/* Tab-Based Interactive Demo */}
          <div className="mb-16">
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {['Passive Wealth', 'RWA Investing', 'Credit Access'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-primary text-white shadow-[0_0_20px_rgba(255,0,92,0.4)]"
                      : "bg-surface-elevated text-text-secondary hover:bg-border"
                  }`}
                >
                  {tab}
                </motion.button>
              ))}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              >
                {/* Left: Feature Visual */}
                <div className="relative">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-2xl bg-gradient-to-br from-surface-elevated to-surface">
                    <div className="p-8 h-full flex flex-col justify-center">
                      {activeTab === "Passive Wealth" && (
                        <div className="space-y-6">
                          <div className="text-5xl mb-4">💰</div>
                          <h3 className="text-3xl font-bold mb-4">Auto-Split Demo</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/30">
                              <span>Cash to Bank</span>
                              <span className="font-bold text-success">80% ($160)</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-secondary/30">
                              <span>USDC Savings</span>
                              <span className="font-bold text-secondary">15% ($30)</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10 border border-warning/30">
                              <span>RWA Investment</span>
                              <span className="font-bold text-warning">5% ($10)</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === "RWA Investing" && (
                        <div className="space-y-6">
                          <div className="text-5xl mb-4">🏠</div>
                          <h3 className="text-3xl font-bold mb-4">Real Asset Portfolio</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10 border border-warning/30">
                              <div>
                                <div className="font-bold">PAXG (Gold)</div>
                                <div className="text-sm text-text-muted">40% allocation</div>
                              </div>
                              <div className="text-success">+3.2%</div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
                              <div>
                                <div className="font-bold">ONDO (Treasuries)</div>
                                <div className="text-sm text-text-muted">30% allocation</div>
                              </div>
                              <div className="text-success">+12.5%</div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-secondary/30">
                              <div>
                                <div className="font-bold">BUIDL (Stablecoins)</div>
                                <div className="text-sm text-text-muted">30% allocation</div>
                              </div>
                              <div className="text-success">+5.2%</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === "Credit Access" && (
                        <div className="space-y-6">
                          <div className="text-5xl mb-4">💳</div>
                          <h3 className="text-3xl font-bold mb-4">Credit Profile</h3>
                          <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                              <div className="text-2xl font-bold text-success mb-1">$200</div>
                              <div className="text-sm text-text-secondary">Available Credit</div>
                            </div>
                            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                              <div className="text-2xl font-bold text-primary mb-1">5.5%</div>
                              <div className="text-sm text-text-secondary">Interest Rate</div>
                            </div>
                            <div className="text-sm text-text-muted">
                              ✓ Based on 6 months of consistent transfers<br />
                              ✓ 60% lower than regional average<br />
                              ✓ Auto-repayment from next transfer
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Floating Notification */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-success border border-success shadow-lg"
                  >
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span>💰</span>
                      <span>$40 auto-invested!</span>
                    </div>
                  </motion.div>
                </div>
                
                {/* Right: Feature Details */}
                <div>
                  {activeTab === "Passive Wealth" && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl">
                          💰
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold">Passive Wealth Building</h3>
                          <p className="text-text-secondary">Set it and forget it</p>
                        </div>
                      </div>
                      
                      <p className="text-text-secondary leading-relaxed mb-6">
                        Every transfer automatically splits: 80% to recipient's bank, 15% to USDC savings vault, 5% to tokenized real assets. Your family receives what they need while building wealth in the background.
                      </p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Automated wealth accumulation</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Customizable split percentages</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Real-time balance tracking</span>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                        <p className="text-sm font-semibold text-success mb-2">
                          Real Impact: Maria's Story
                        </p>
                        <p className="text-sm text-text-secondary">
                          "In 6 months, I've saved $1,200 automatically. My family back home has an emergency fund for the first time ever."
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "RWA Investing" && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning to-success flex items-center justify-center text-3xl">
                          🏠
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold">RWA Micro-Investing</h3>
                          <p className="text-text-secondary">Build real wealth</p>
                        </div>
                      </div>
                      
                      <p className="text-text-secondary leading-relaxed mb-6">
                        Invest in fractional ownership of gold, real estate, and treasury bonds through tokenized RWAs. Start with as little as $1 and diversify into institutional-grade assets previously out of reach.
                      </p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>PAXG (tokenized gold)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>ONDO (tokenized treasuries)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Voice-activated investing</span>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/30">
                        <p className="text-sm font-semibold text-secondary mb-2">
                          🤖 AI Guidance
                        </p>
                        <p className="text-sm text-text-secondary">
                          Get personalized allocations, risk matching, and bilingual education to make informed investment decisions.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "Credit Access" && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-secondary flex items-center justify-center text-3xl">
                          💳
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold">Remittance-Backed Credit</h3>
                          <p className="text-text-secondary">Access when you need it</p>
                        </div>
                      </div>
                      
                      <p className="text-text-secondary leading-relaxed mb-6">
                        Your consistent transfer history becomes your credit score. Access micro-loans of $50-$200 with interest rates 60% lower than regional averages. Auto-repayment from your next transfer keeps you in good standing.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                          <div className="text-2xl font-bold text-success mb-1">$50-$200</div>
                          <div className="text-sm text-text-secondary">Loan amounts</div>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                          <div className="text-2xl font-bold text-success mb-1">5-8%</div>
                          <div className="text-sm text-text-secondary">Interest rate</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-text-secondary">
                        <p>✓ Based on remittance consistency, not credit bureaus</p>
                        <p>✓ Auto-repayment from next transfer</p>
                        <p>✓ Builds credit profile within StablePago ecosystem</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* STEP 5: Interactive Voice Commands Section - PROGRESSIVE DISCLOSURE */}
      <section id="voice" className="py-20 px-4 bg-gradient-to-br from-secondary/5 via-primary/5 to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <CollapsibleSection
            id="voice-commands"
            title="Your Money Talks — Literally"
            subtitle="Telegram Bot + ElevenLabs voice recognition in English or Spanish"
            icon={<span className="text-5xl">🎙️</span>}
            preview={
              <>
                {/* Preview: Show 2 command examples */}
                <div className="max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
                    {presetCommands.slice(0, 2).map((cmd) => (
                      <motion.div
                        key={cmd.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: cmd.id * 0.1 }}
                        className="p-6 rounded-xl bg-surface-elevated border border-border"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                            {cmd.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-mono text-xs text-primary">
                              "{cmd.text}"
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-text-muted">{cmd.action}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-center mt-6 text-text-muted text-sm">
                    Try {presetCommands.length - 2} more voice commands • Interactive simulator • Bilingual support
                  </div>
                </div>
              </>
            }
          >
            {/* Full Interactive Voice Simulator */}
            <div className="mb-12">
            <div className="max-w-3xl mx-auto">
              <div className="card-arc p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Try a Command</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Language:</span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-lg bg-primary text-white text-sm font-semibold">
                        EN
                      </button>
                      <button className="px-3 py-1 rounded-lg bg-surface-elevated text-text-secondary text-sm font-semibold hover:bg-border transition-colors">
                        ES
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Preset Commands */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {presetCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => simulateVoiceCommand(cmd)}
                      className="text-left p-4 rounded-xl bg-surface-elevated border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-xl">
                          {cmd.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-mono text-sm text-primary mb-1">
                            "{cmd.text}"
                          </div>
                          <div className="text-xs text-text-muted">
                            {cmd.action}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Voice Visualization */}
                {isSimulating && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                  >
                    <VoiceWaveform active={isSimulating} />
                  </motion.div>
                )}
                
                {/* Response Display */}
                <AnimatePresence>
                  {response && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 rounded-xl bg-success/10 border border-success/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-success mb-1">
                            Response from StablePago AI
                          </p>
                          <p className="text-sm">{response}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "🗣️", title: "Natural Speech", desc: "Talk like you normally would" },
                { icon: "🌐", title: "Bilingual", desc: "English & Spanish supported" },
                { icon: "⚡", title: "Instant", desc: "Real-time response in <2 seconds" }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="card-arc p-6 text-center hover:scale-105 transition-transform"
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h4 className="font-bold mb-2">{item.title}</h4>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </section>

      {/* STEP 6: Enhanced Comparison Table */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">
              Empowering Families to Grow — Not Just Receive
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              See how StablePago transforms every transfer into lasting wealth
            </p>
          </motion.div>
          
          {/* Split Screen Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Traditional (Negative) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 0.98 }}
              className="relative rounded-2xl overflow-hidden border-2 border-error/30 bg-gradient-to-br from-error/5 to-error/10"
            >
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-error/20 text-error text-xs font-bold">
                OLD WAY ❌
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-error/20 flex items-center justify-center text-2xl">
                    🏦
                  </div>
                  <h3 className="text-2xl font-bold">Traditional Remittance</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: "Transfer Fee", value: "5-10%", bad: true },
                    { label: "Settlement", value: "3-5 days", bad: true },
                    { label: "Minimum", value: "$50-$100", bad: true },
                    { label: "Wealth Tools", value: "None", bad: true },
                    { label: "Access", value: "Physical locations", bad: true }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-error/5">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="font-bold text-error flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-lg bg-error/10 border border-error/30">
                  <p className="text-sm text-error font-semibold mb-1">
                    The Hidden Cost:
                  </p>
                  <p className="text-sm text-text-secondary">
                    A family sending $200/month loses <strong>$120-240/year</strong> in fees alone — enough for a month's groceries.
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* StablePago (Positive) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="relative rounded-2xl overflow-hidden border-2 border-success/30 bg-gradient-to-br from-success/5 to-secondary/10 shadow-[0_0_30px_rgba(0,214,143,0.2)]"
            >
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold">
                NEW WAY ✨
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
                    🚀
                  </div>
                  <h3 className="text-2xl font-bold">StablePago</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: "Transfer Fee", value: "1.25%", improvement: "80% cheaper" },
                    { label: "Settlement", value: "1-2 minutes", improvement: "100x faster" },
                    { label: "Minimum", value: "$1", improvement: "98% lower" },
                    { label: "Wealth Tools", value: "Savings + Investing + Credit", highlight: true },
                    { label: "Access", value: "Voice + App 24/7", highlight: true }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                      <span className="text-text-secondary">{item.label}</span>
                      <div className="text-right">
                        <div className="font-bold text-success flex items-center gap-2 justify-end">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {item.value}
                        </div>
                        {item.improvement && (
                          <div className="text-xs text-success/70">{item.improvement}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/30">
                  <p className="text-sm text-success font-semibold mb-1">
                    The Opportunity:
                  </p>
                  <p className="text-sm text-text-secondary">
                    That same family <strong>saves $200-220/year</strong> in fees and can now <strong>build $2,400+ wealth</strong> over 5 years automatically.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Wealth Growth Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-success/10 to-secondary/10 border border-success/30">
              <div className="flex items-end justify-center gap-4 h-48 mb-6">
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-12 bg-error rounded-t-lg"></div>
                  <div className="text-sm font-semibold">Year 1</div>
                  <div className="text-xs text-text-muted">$0</div>
                </div>
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-24 bg-warning rounded-t-lg"></div>
                  <div className="text-sm font-semibold">Year 2</div>
                  <div className="text-xs text-success">$480</div>
                </div>
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-36 bg-secondary rounded-t-lg"></div>
                  <div className="text-sm font-semibold">Year 3</div>
                  <div className="text-xs text-success">$1,020</div>
                </div>
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-44 bg-primary rounded-t-lg"></div>
                  <div className="text-sm font-semibold">Year 4</div>
                  <div className="text-xs text-success">$1,600</div>
                </div>
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-48 bg-success rounded-t-lg"></div>
                  <div className="text-sm font-semibold">Year 5</div>
                  <div className="text-xs text-success">$2,400+</div>
                </div>
              </div>
              <div className="text-lg font-semibold text-white">
                📈 Wealth accumulation with StablePago auto-split
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STEP 7: Enhanced Caribbean Focus - PROGRESSIVE DISCLOSURE */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-surface">
        <div className="max-w-6xl mx-auto">
          <CollapsibleSection
            id="caribbean-focus"
            title="Built for the Caribbean"
            subtitle="Reaching the unbanked, reducing transfer costs by 80%, bringing investment tools to families previously left out of finance"
            icon={<span className="text-5xl">🌍</span>}
            preview={
              <>
                {/* Preview: Show flags and country names only */}
                <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto px-4">
                  {[
                    { flag: '🇵🇷', name: 'Puerto Rico', volume: '$2.8B/year' },
                    { flag: '🇩🇴', name: 'Dominican Republic', volume: '$8.6B/year' },
                    { flag: '🇭🇹', name: 'Haiti', volume: '$3.8B/year' }
                  ].map((country, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center"
                    >
                      <div className="text-6xl mb-3">{country.flag}</div>
                      <div className="font-bold text-sm mb-1">{country.name}</div>
                      <div className="text-xs text-primary">{country.volume}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="text-center mt-8 text-text-muted text-sm">
                  $15.1B total remittance volume • 25.8M people • Full stats & features
                </div>
              </>
            }
          >
            {/* Full Country Cards with Enhanced Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                code: 'PR',
                flag: '🇵🇷',
                name: 'Puerto Rico',
                tagline: 'Direct USD transfers via U.S. banking rails',
                stats: {
                  population: '3.2M',
                  remittanceVolume: '$2.8B/year',
                  unbanked: '12%'
                },
                features: [
                  'Instant ACH',
                  'Zero currency conversion',
                  'Full FDIC integration'
                ],
                gradient: 'from-red-500/20 to-blue-500/20'
              },
              {
                code: 'DO',
                flag: '🇩🇴',
                name: 'Dominican Republic',
                tagline: 'DOP conversion and bank integrations',
                stats: {
                  population: '11M',
                  remittanceVolume: '$8.6B/year',
                  unbanked: '45%'
                },
                features: [
                  'All major banks',
                  'Real-time exchange rates',
                  'Mobile money'
                ],
                gradient: 'from-blue-500/20 to-red-500/20'
              },
              {
                code: 'HT',
                flag: '🇭🇹',
                name: 'Haiti',
                tagline: 'Mobile money via MonCash',
                stats: {
                  population: '11.5M',
                  remittanceVolume: '$3.8B/year',
                  unbanked: '78%'
                },
                features: [
                  'Instant to mobile wallets',
                  'HTG conversion',
                  'No bank required'
                ],
                gradient: 'from-blue-500/20 to-red-600/20',
                badge: 'Q2 2025'
              }
            ].map((country, idx) => (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedCountry(country.code)}
                className={`relative overflow-hidden rounded-2xl border-2 p-8 cursor-pointer transition-all ${
                  `bg-gradient-to-br ${country.gradient}`
                } ${
                  selectedCountry === country.code 
                    ? "border-primary shadow-[0_0_30px_rgba(255,0,92,0.3)]" 
                    : "border-border"
                }`}
              >
                {/* Flag Header */}
                <div className="text-6xl mb-4 text-center">{country.flag}</div>
                
                {/* Country Name */}
                <h3 className="text-2xl font-bold text-center mb-2">
                  {country.name}
                </h3>
                <p className="text-sm text-text-secondary text-center mb-6">
                  {country.tagline}
                </p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {Object.entries(country.stats).map(([key, value]) => (
                    <div key={key} className="text-center p-2 rounded-lg bg-surface-elevated/50 backdrop-blur-sm">
                      <div className="text-lg font-bold text-primary">{value}</div>
                      <div className="text-xs text-text-muted capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Features */}
                <div className="space-y-2">
                  {country.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Coming Soon Badge */}
                {country.badge && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-warning/20 text-warning text-xs font-bold">
                    {country.badge}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
            {/* Regional Impact */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/30 p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">
                    <CountUp end={15.1} decimals={1} suffix="B" prefix="$" />
                  </div>
                  <div className="text-sm text-text-secondary">Total Annual Remittances</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-secondary mb-2">
                    <CountUp end={25.8} decimals={1} suffix="M" />
                  </div>
                  <div className="text-sm text-text-secondary">People We Can Help</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-success mb-2">
                    <CountUp end={18} suffix="%" />
                  </div>
                  <div className="text-sm text-text-secondary">Average of Regional GDP</div>
                </div>
              </div>
            </motion.div>
          </CollapsibleSection>
        </div>
      </section>

      {/* STEP 8: Optimized Waitlist Form */}
      <section id="waitlist" className="py-20 px-4 relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20" style={{ 
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.2), transparent 60%)' 
          }}></div>
        </div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Social Proof Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-secondary"
                />
              ))}
            </div>
            <div className="text-sm">
              <div className="font-bold text-foreground">
                <CountUp end={5247} />+ joined
              </div>
              <div className="text-text-muted">Last spot taken 2 min ago</div>
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-center mb-4"
          >
            Be First to Build Wealth with Every Transfer 🚀
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-text-secondary text-center mb-8"
          >
            Get early access to StablePago — receive launch updates, referral rewards, and beta invites.
          </motion.p>
          
          {!submitSuccess ? (
            <motion.form 
              onSubmit={handleWaitlistSubmit} 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {/* Email Input with Validation */}
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border px-6 py-4 text-lg bg-surface border-border text-foreground focus:border-secondary focus:ring-2 focus:ring-secondary/20 placeholder:text-text-muted transition-all duration-200"
                />
                {email && isValidEmail(email) && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Country Selector with Flags */}
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-6 py-4 text-lg text-foreground focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-200"
              >
                <option value="">🌎 Select Country (Optional)</option>
                <option value="PR">🇵🇷 Puerto Rico</option>
                <option value="DO">🇩🇴 Dominican Republic</option>
                <option value="HT">🇭🇹 Haiti</option>
                <option value="US">🇺🇸 United States</option>
                <option value="OTHER">🌍 Other</option>
              </select>
              
              {/* Benefits Checklist */}
              <div className="rounded-xl bg-surface-elevated border border-border p-4">
                <div className="text-sm font-semibold mb-3">You'll get:</div>
                <div className="space-y-2 text-sm">
                  {[
                    "Early access invitation (limited spots)",
                    "$25 bonus USDC when you join",
                    "Referral program access (earn $10 per invite)",
                    "Product updates & feature previews"
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span className="text-text-secondary">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  I agree to receive product updates, early access messages, and occasional marketing communications.
                </span>
              </label>

              {submitError && (
                <div className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                  {submitError}
                </div>
              )}

              {/* Submit Button with Loading State */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full text-lg py-4 glow-primary group relative overflow-hidden disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Waitlist
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </span>
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
              
              <p className="text-center text-sm text-text-muted">
                We respect your inbox — no spam. Unsubscribe anytime.
              </p>
            </motion.form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-arc p-8 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 border-2 border-success mx-auto mb-4">
                <svg className="h-8 w-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {isExistingMember ? "You're already on the list! 🙌" : "You're on the list! 🎉"}
              </h3>
              <p className="text-text-secondary mb-6">
                {successMessage ?? (isExistingMember
                  ? "Looks like you're already queued up — we'll keep you posted on launch updates."
                  : "We'll notify you as soon as StablePago launches. Check your email for your exclusive invite!")}
              </p>
              {waitlistPosition !== null && !isExistingMember && (
                <div className="mb-4 rounded-lg bg-surface-elevated border border-border px-4 py-3 text-sm">
                  You're currently <span className="font-semibold">#{waitlistPosition.toLocaleString()}</span> in line.
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success text-sm">
                <span>💰</span>
                <span>You'll receive $25 USDC bonus on signup</span>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* STEP 9: Enhanced Partners Section - PROGRESSIVE DISCLOSURE */}
      <section id="partners" className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <CollapsibleSection
            id="technology-partners"
            title="Powered by Trusted Infrastructure"
            subtitle="Built on audited, enterprise-grade rails — non-custodial wallets, regulated stablecoins, and institutional-grade security"
            icon={<span className="text-5xl">🏦</span>}
            preview={
              <>
                {/* Trust Badges - Always Visible */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap items-center justify-center gap-6 mb-12 px-4"
                >
                  {[
                    { icon: "🛡️", label: "SOC 2 Certified" },
                    { icon: "🔒", label: "Bank-Grade Security" },
                    { icon: "✅", label: "Regulatory Compliant" }
                  ].map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border">
                      <span className="text-xl">{badge.icon}</span>
                      <span className="text-sm font-semibold">{badge.label}</span>
                    </div>
                  ))}
                </motion.div>

                {/* Preview: Simple partner logo grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
                  {[
                    { name: "Circle", icon: "⭕", tagline: "USDC & CCTP" },
                    { name: "Crossmint", icon: "⚡", tagline: "Smart Wallets" },
                    { name: "Uniswap", icon: "🔄", tagline: "DeFi Access" },
                    { name: "CoinGecko", icon: "📊", tagline: "Market Data" },
                    { name: "ElevenLabs", icon: "🎙️", tagline: "Voice AI" },
                    { name: "Arc Network", icon: "🔷", tagline: "L1 Blockchain" }
                  ].map((partner, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="text-center p-4 rounded-xl bg-surface-elevated border border-border"
                    >
                      <div className="text-4xl mb-2">{partner.icon}</div>
                      <div className="font-bold text-sm mb-1">{partner.name}</div>
                      <div className="text-xs text-text-muted">{partner.tagline}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="text-center mt-8 text-text-muted text-sm">
                  View detailed partner information and metrics
                </div>
              </>
            }
          >
            {/* Full Partner Cards with Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: "Circle",
                category: "USDC & CCTP",
                description: "USDC issuance & cross-chain bridge via Circle's Cross-Chain Transfer Protocol",
                metric: "$150B+ transacted",
                color: "primary",
                icon: "⭕"
              },
              {
                name: "Crossmint",
                category: "Smart Wallets",
                description: "Non-custodial wallet infrastructure with Web2-friendly email authentication",
                metric: "10M+ wallets created",
                color: "secondary",
                icon: "⚡"
              },
              {
                name: "Uniswap",
                category: "DeFi Access",
                description: "Token swapping & RWA asset access through battle-tested DEX protocols",
                metric: "$2T+ traded",
                color: "warning",
                icon: "🔄"
              },
              {
                name: "CoinGecko",
                category: "Market Data",
                description: "Real-time pricing, RWA token discovery, and portfolio tracking APIs",
                metric: "100M+ users",
                color: "secondary",
                icon: "📊"
              },
              {
                name: "ElevenLabs",
                category: "Voice AI",
                description: "Natural language processing for bilingual voice commands via Telegram",
                metric: "99% accuracy",
                color: "primary",
                icon: "🎙️"
              },
              {
                name: "Arc Network",
                category: "L1 Blockchain",
                description: "Gas-free USDC transactions with native FX engine for instant settlement",
                metric: "Sub-second finality",
                color: "success",
                icon: "🌐",
                badge: "Coming Q3 2025"
              }
            ].map((partner, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="card-arc p-6 group hover:border-border-hover transition-all"
              >
                {/* Icon & Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-xl bg-${partner.color}/10 border border-${partner.color}/30 flex items-center justify-center text-3xl`}>
                    {partner.icon}
                  </div>
                  {partner.badge && (
                    <div className="px-2 py-1 rounded-full bg-warning/20 text-warning text-xs font-bold">
                      {partner.badge}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="mb-3">
                  <div className={`text-sm font-semibold text-${partner.color} mb-1`}>
                    {partner.category}
                  </div>
                  <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {partner.name}
                  </h4>
                </div>
                
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {partner.description}
                </p>
                
                {/* Metric */}
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="font-semibold text-success">{partner.metric}</span>
                </div>
              </motion.div>
            ))}
          </div>
          
            {/* Security & Compliance Footer */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-gradient-to-r from-success/10 via-secondary/10 to-success/10 border border-success/30 p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="flex items-center justify-center mb-2 text-4xl">
                    🛡️
                  </div>
                  <div className="font-bold mb-1">Non-Custodial</div>
                  <div className="text-sm text-text-secondary">You own your keys</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2 text-4xl">
                    🔒
                  </div>
                  <div className="font-bold mb-1">End-to-End Encrypted</div>
                  <div className="text-sm text-text-secondary">Bank-grade security</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2 text-4xl">
                    ✅
                  </div>
                  <div className="font-bold mb-1">Regulatory Compliant</div>
                  <div className="text-sm text-text-secondary">KYC/AML + Travel Rule</div>
                </div>
              </div>
            </motion.div>
          </CollapsibleSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to About")}
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to Careers")}
                  >
                    Careers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to Blog")}
                  >
                    Blog
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to Press")}
                  >
                    Press
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>
                  <button
                    type="button"
                    onClick={() => handleSectionNavigation("features")}
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleSectionNavigation("solution")}
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleSectionNavigation("voice")}
                    className="hover:text-white transition-colors"
                  >
                    Voice AI
                  </button>
                </li>
                <li><a href="/home" className="hover:text-white transition-colors">Wallet</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-text-secondary">
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to Privacy Policy")}
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to Terms of Service")}
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to Compliance")}
                  >
                    Compliance
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><a href="mailto:juandisaac@allow-me.xyz" className="hover:text-white transition-colors">juandisaac@allow-me.xyz</a></li>
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to Telegram")}
                  >
                    Telegram
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-white transition-colors"
                    onClick={() => console.log("Navigate to Twitter")}
                  >
                    Twitter
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              © 2025 StablePago LLC · All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-secondary hover:text-primary transition-colors"
                onClick={() => console.log("Navigate to Twitter")}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </button>
              <button
                type="button"
                className="text-secondary hover:text-primary transition-colors"
                onClick={() => console.log("Navigate to YouTube")}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.197-.054-.308-.346-.11l-6.4 4.02-2.76-.918c-.6-.183-.612-.6.126-.89l10.782-4.156c.5-.18.943.11.778.89z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal - Lazy loaded */}
      {isVideoModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" /></div>}>
          <VideoModal
            isOpen={isVideoModalOpen}
            onClose={closeVideoModal}
            videoUrl="/videos/demo.mp4"
          />
        </Suspense>
      )}
    </div>
  );
}



