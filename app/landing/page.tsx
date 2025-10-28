"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Connect to your backend API
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitSuccess(true);
      setEmail("");
      setCountry("");
    } catch (error) {
      console.error("Failed to join waitlist:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-arc border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="StablePago" width={40} height={40} className="rounded-xl" />
              <span className="text-xl font-bold tracking-tight">StablePago</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-text-secondary hover:text-white transition-colors">Features</a>
              <a href="#why" className="text-text-secondary hover:text-white transition-colors">Why Us</a>
              <a href="#partners" className="text-text-secondary hover:text-white transition-colors">Partners</a>
              <Link href="/home" className="rounded-xl bg-primary hover:bg-[#CC0049] text-white px-6 py-2 font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,0,92,0.4)] hover:scale-[1.02]">
                Launch App
              </Link>
            </div>
            
            {/* Mobile menu button */}
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
          
          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border">
              <div className="px-4 py-4 space-y-3">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-text-secondary hover:text-white transition-colors">Features</a>
                <a href="#why" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-text-secondary hover:text-white transition-colors">Why Us</a>
                <a href="#partners" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-text-secondary hover:text-white transition-colors">Partners</a>
                <Link href="/home" className="block rounded-xl bg-primary hover:bg-[#CC0049] text-white px-6 py-3 font-semibold text-center transition-all duration-200">
                  Launch App
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 20%, rgba(255, 0, 92, 0.2), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 240, 255, 0.15), transparent 50%)' }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto text-center py-20">
          <div className="mb-8">
            <div className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 mb-6">
              <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                🌴 Build Caribbean Prosperity, One Transfer at a Time
              </span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Send. Save. Grow.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-glow-pulse">
              The Next Generation
            </span><br />
            of Caribbean Remittance.
          </h1>
          
          <p className="text-xl sm:text-2xl text-text-secondary max-w-4xl mx-auto mb-12 leading-relaxed">
            StablePago turns every remittance into wealth creation — earn yield, invest in real assets, and access credit while sending money home.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <a href="#waitlist" className="btn-primary text-lg px-10 py-4 glow-primary w-full sm:w-auto">
              Join the Waitlist
            </a>
            <a href="#solution" className="btn-secondary text-lg px-10 py-4 w-full sm:w-auto">
              See How It Works
            </a>
          </div>

          {/* Wealth Impact Animation Placeholder */}
          <div className="relative h-64 rounded-2xl bg-gradient-to-br from-surface-elevated to-surface border border-border overflow-hidden mb-12">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-sm text-text-muted uppercase tracking-wider">Traditional</div>
                  <div className="text-4xl">💵</div>
                  <div className="text-sm text-text-secondary">Money flows out</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-text-muted uppercase tracking-wider">StablePago</div>
                  <div className="text-4xl flex gap-2 justify-center">💰🏆📈</div>
                  <div className="text-sm text-success font-semibold">Wealth accumulates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Core Features</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Designed for simplicity, built for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Email / Social Login */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 mb-4">
                <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">🔐 Email / Social Login</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                No crypto knowledge needed — onboard with Google or email.
              </p>
            </div>

            {/* Buy USDC with Card */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 mb-4">
                <svg className="h-7 w-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">💳 Buy USDC with Card</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Instant funding via Crossmint Checkout.
              </p>
            </div>

            {/* Send by Email */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 mb-4">
                <svg className="h-7 w-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">📧 Send by Email</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Recipient does not need a wallet — auto-creates one on first transfer.
              </p>
            </div>

            {/* Withdraw to Banks */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30 mb-4">
                <svg className="h-7 w-7 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">🏦 Withdraw to Banks</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Direct bank deposits across Puerto Rico & Dominican Republic.
              </p>
            </div>

            {/* Mobile Money */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 mb-4">
                <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">📱 Mobile Money</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                MonCash (Haiti) and Orange Cash (DR) integrations for the unbanked.
              </p>
            </div>

            {/* Voice Commands - Bonus Feature */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 border border-secondary/30 mb-4">
                <svg className="h-7 w-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">🎙️ Voice Commands</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Speak naturally in English or Spanish via Telegram — no typing needed.
              </p>
            </div>

            {/* RWA Market Data */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-warning/5 to-success/5 border-warning/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-warning/20 to-success/20 border border-warning/30 mb-4">
                <svg className="h-7 w-7 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">📊 Market Intelligence</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Real-time RWA token prices, trending coins, and market data via Telegram bot.
              </p>
            </div>

            {/* Real-Time Insights */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-success/5 to-secondary/5 border-success/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-success/20 to-secondary/20 border border-success/30 mb-4">
                <svg className="h-7 w-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">📈 Live Price Tracking</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Ask about any token price, portfolio value, or trending assets — instant answers.
              </p>
            </div>
          </div>

          {/* Second Row - Delegation Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Delegated Wallets for Family */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-primary/10 to-secondary/10 border-l-4 border-primary">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex-shrink-0">
                  <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">👵 Family Delegation Wallets</h3>
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
            </div>

            {/* AI Agent Investment Wallets */}
            <div className="card-arc p-6 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-secondary/10 to-success/10 border-l-4 border-secondary">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-success/20 border border-secondary/30 flex-shrink-0">
                  <svg className="h-7 w-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">🤖 Telegram Agent Wallet</h3>
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
            </div>
          </div>

          {/* Feature Highlight Bar */}
          <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/30 p-6 text-center">
            <p className="text-lg font-semibold text-white mb-2">
              ✨ All features work seamlessly together — from onboarding to wealth building
            </p>
            <p className="text-sm text-text-secondary">
              Start with $1 • No minimum balance • Available 24/7 • Support in English & Spanish
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-error">$140B</span> in annual remittances,<br />
              <span className="text-text-muted">$0 in lasting wealth.</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
              Caribbean families receive billions in remittances yearly, yet most funds are consumed immediately, eroded by inflation, and never build credit or investment history. <strong className="text-white">Traditional services stop at delivery — StablePago doesn't.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card-arc p-8 text-center">
              <div className="text-6xl font-bold text-error mb-4">80%</div>
              <p className="text-text-secondary">of remittances spent within 48 hours</p>
            </div>
            <div className="card-arc p-8 text-center">
              <div className="text-6xl font-bold text-warning mb-4">0%</div>
              <p className="text-text-secondary">allocated to yield-bearing accounts</p>
            </div>
            <div className="card-arc p-8 text-center">
              <div className="text-6xl font-bold text-secondary mb-4">25%</div>
              <p className="text-text-secondary">of GDP in some nations depends on remittances</p>
            </div>
          </div>

          <div className="text-center">
            <a href="#solution" className="inline-flex items-center gap-2 text-lg text-secondary hover:text-primary transition-colors font-semibold">
              Learn How We Fix This
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-4">From Money Transfer to Wealth Transfer</h2>
          <p className="text-xl text-text-secondary text-center mb-16 max-w-3xl mx-auto">
            Three innovations that turn remittances into lasting prosperity
          </p>

          <div className="space-y-8">
            {/* Feature 1: Passive Wealth Building */}
            <div className="card-arc p-10 border-l-4 border-primary">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="text-5xl">💰</div>
                  <div className="text-sm font-bold text-primary mt-2">1️⃣</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-4">Passive Wealth Building</h3>
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold text-secondary mb-3">Auto-Split Transfers</h4>
                    <div className="space-y-2 text-text-secondary">
                      <div className="flex items-center gap-3">
                        <span className="text-success">✓</span>
                        <span>80% cash → local bank</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-success">✓</span>
                        <span>15% → USDC savings vault</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-success">✓</span>
                        <span>5% → tokenized Treasuries (ONDO, BUIDL)</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 p-6">
                    <p className="text-lg italic text-white">
                      "A family saving 20% of $200 monthly builds <strong className="text-success">$2,400+</strong> in five years — automatically."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: RWA Micro-Investing */}
            <div className="card-arc p-10 border-l-4 border-secondary">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="text-5xl">🏠</div>
                  <div className="text-sm font-bold text-secondary mt-2">2️⃣</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-4">RWA Micro-Investing</h3>
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold text-warning mb-3">Invest in Real Assets</h4>
                    <div className="space-y-3 text-text-secondary mb-6">
                      <p>• Fractional gold, real estate, and treasury tokens (PAXG, ONDO, MANTRA)</p>
                      <p>• Voice command: <code className="px-3 py-1 rounded bg-surface-elevated text-secondary font-mono text-sm">"Invertir $10 al mes en oro."</code></p>
                      <p>• Real-time dashboards tracking portfolio growth</p>
                    </div>
                    <div className="rounded-xl bg-secondary/10 border border-secondary/30 p-4">
                      <p className="text-sm font-semibold text-secondary">
                        🤖 AI Guidance: personalized allocations, risk matching, and education in English / Spanish
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Remittance-Backed Credit */}
            <div className="card-arc p-10 border-l-4 border-success">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="text-5xl">💳</div>
                  <div className="text-sm font-bold text-success mt-2">3️⃣</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-4">Remittance-Backed Credit</h3>
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold text-success mb-3">Turning Consistency into Credit</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl bg-surface-elevated border border-border p-4">
                        <div className="text-2xl font-bold text-success mb-1">$50-$200</div>
                        <div className="text-sm text-text-secondary">Micro-loans secured by remittance history</div>
                      </div>
                      <div className="rounded-xl bg-surface-elevated border border-border p-4">
                        <div className="text-2xl font-bold text-success mb-1">5-8%</div>
                        <div className="text-sm text-text-secondary">Interest rate (60% lower than regional avg)</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-text-secondary">
                      <p>✓ Auto-repayment from next transfer</p>
                      <p>✓ Builds credit profile within StablePago ecosystem</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI + Voice Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-secondary/5 to-primary/5">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">Your Money Talks — Literally. 🎙️</h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-12">
            Telegram Bot + ElevenLabs voice recognition in English or Spanish
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="card-arc p-8 text-left">
              <div className="text-4xl mb-4">🗣️</div>
              <h3 className="text-2xl font-bold mb-4 text-secondary">Voice Commands</h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-surface-elevated p-4 font-mono text-sm">
                  <span className="text-primary">&gt;</span> "Enviar 20 USDC a mamá."
                </div>
                <div className="rounded-lg bg-surface-elevated p-4 font-mono text-sm">
                  <span className="text-primary">&gt;</span> "Invertir $10 en ONDO."
                </div>
                <div className="rounded-lg bg-surface-elevated p-4 font-mono text-sm">
                  <span className="text-primary">&gt;</span> "Check my savings balance."
                </div>
                <div className="rounded-lg bg-surface-elevated p-4 font-mono text-sm">
                  <span className="text-primary">&gt;</span> "What's the price of PAXG?"
                </div>
                <div className="rounded-lg bg-surface-elevated p-4 font-mono text-sm">
                  <span className="text-primary">&gt;</span> "Show me trending RWA tokens."
                </div>
                <div className="rounded-lg bg-surface-elevated p-4 font-mono text-sm border border-primary/30">
                  <span className="text-primary">&gt;</span> "Create a wallet for grandma with $50 daily limit."
                </div>
                <div className="rounded-lg bg-surface-elevated p-4 font-mono text-sm border border-secondary/30">
                  <span className="text-primary">&gt;</span> "Delegate $100 to agent, invest in ONDO monthly."
                </div>
              </div>
            </div>

            <div className="card-arc p-8 text-left">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold mb-4 text-success">Real-Time Responses</h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-sm">
                  <span className="text-success">✓</span> "Tu inversión en oro ha subido 3.2% este mes."
                </div>
                <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-sm">
                  <span className="text-success">✓</span> "Transfer complete! $20 sent to María."
                </div>
                <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-sm">
                  <span className="text-success">✓</span> "Your USDC vault earned $2.40 this week."
                </div>
                <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-sm">
                  <span className="text-success">✓</span> "PAXG is $2,645.32, up 1.8% today."
                </div>
                <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-sm">
                  <span className="text-success">✓</span> "Top RWA: ONDO +12%, MANTRA +8.5%, BUIDL stable."
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-sm">
                  <span className="text-success">✓</span> "Wallet created! Grandma can withdraw up to $50/day."
                </div>
                <div className="rounded-lg bg-secondary/10 border border-secondary/30 p-4 text-sm">
                  <span className="text-success">✓</span> "Agent wallet active. DCA $25/week into ONDO starting Monday."
                </div>
              </div>
            </div>
          </div>

          {/* Voice Waveform Visual */}
          <div className="h-24 rounded-2xl bg-gradient-to-r from-secondary/20 via-primary/20 to-secondary/20 border border-secondary/30 flex items-center justify-center overflow-hidden">
            <div className="flex items-center gap-2">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-gradient-to-t from-secondary to-primary rounded-full animate-pulse" 
                  style={{ 
                    height: `${20 + Math.random() * 40}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Wealth Impact Comparison */}
      <section id="why" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Empowering Families to Grow — Not Just Receive</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              See how StablePago transforms every transfer into lasting wealth
            </p>
          </div>

          {/* Comparison Table */}
          <div className="card-arc overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-6 text-text-secondary font-semibold">Metric</th>
                    <th className="text-left p-6 text-text-secondary font-semibold">Traditional</th>
                    <th className="text-left p-6 text-text-secondary font-semibold bg-gradient-to-r from-primary/5 to-secondary/5">
                      <span className="flex items-center gap-2">
                        StablePago
                        <span className="text-xs px-2 py-1 rounded-full bg-primary text-white">NEW</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-6 font-medium">Transfer Fee</td>
                    <td className="p-6 text-error">5-10%</td>
                    <td className="p-6 text-success font-bold bg-gradient-to-r from-primary/5 to-secondary/5">1.25%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-6 font-medium">Settlement Time</td>
                    <td className="p-6 text-text-secondary">3-5 days</td>
                    <td className="p-6 text-success font-bold bg-gradient-to-r from-primary/5 to-secondary/5">1-2 minutes</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-6 font-medium">Minimum Amount</td>
                    <td className="p-6 text-text-secondary">$50-$100</td>
                    <td className="p-6 text-success font-bold bg-gradient-to-r from-primary/5 to-secondary/5">$1</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-6 font-medium">Wealth Features</td>
                    <td className="p-6 text-error">None</td>
                    <td className="p-6 text-success font-bold bg-gradient-to-r from-primary/5 to-secondary/5">Savings + Investing + Credit</td>
                  </tr>
                  <tr>
                    <td className="p-6 font-medium">Interface</td>
                    <td className="p-6 text-text-secondary">Physical locations</td>
                    <td className="p-6 text-success font-bold bg-gradient-to-r from-primary/5 to-secondary/5">Voice + App 24/7</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Wealth Accumulation Curve */}
          <div className="text-center">
            <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-success/10 to-secondary/10 border border-success/30">
              <div className="flex items-end justify-center gap-4 h-48">
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-12 bg-error rounded-t-lg"></div>
                  <div className="text-sm font-semibold">Remittance</div>
                </div>
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-24 bg-warning rounded-t-lg"></div>
                  <div className="text-sm font-semibold">+ Savings</div>
                </div>
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-36 bg-secondary rounded-t-lg"></div>
                  <div className="text-sm font-semibold">+ Investing</div>
                </div>
                <div className="space-y-2 text-center" style={{ width: '100px' }}>
                  <div className="h-48 bg-success rounded-t-lg"></div>
                  <div className="text-sm font-semibold">+ Credit</div>
                </div>
              </div>
              <div className="mt-6 text-lg font-semibold text-white">
                📈 Wealth accumulation over time
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Caribbean Focus Section */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">🌍 Built for the Caribbean, Ready for the World</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Reaching the unbanked, reducing transfer costs by 80%, and bringing investment tools to families previously left out of finance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Puerto Rico */}
            <div className="card-arc p-8 hover:scale-[1.02] transition-all duration-300 border-t-4 border-primary">
              <div className="text-5xl mb-4 text-center">🇵🇷</div>
              <h3 className="text-2xl font-bold mb-3 text-center">Puerto Rico</h3>
              <p className="text-text-secondary text-center mb-4">
                Direct USD transfers via U.S. banking rails
              </p>
              <div className="text-sm text-text-muted text-center">
                Instant ACH • Zero currency conversion • Full FDIC integration
              </div>
            </div>

            {/* Dominican Republic */}
            <div className="card-arc p-8 hover:scale-[1.02] transition-all duration-300 border-t-4 border-secondary">
              <div className="text-5xl mb-4 text-center">🇩🇴</div>
              <h3 className="text-2xl font-bold mb-3 text-center">Dominican Republic</h3>
              <p className="text-text-secondary text-center mb-4">
                DOP conversion and bank integrations
              </p>
              <div className="text-sm text-text-muted text-center">
                All major banks • Real-time exchange rates • Mobile money
              </div>
            </div>

            {/* Haiti */}
            <div className="card-arc p-8 hover:scale-[1.02] transition-all duration-300 border-t-4 border-success">
              <div className="text-5xl mb-4 text-center">🇭🇹</div>
              <h3 className="text-2xl font-bold mb-3 text-center">Haiti</h3>
              <p className="text-text-secondary text-center mb-4">
                Mobile money via MonCash
              </p>
              <div className="text-sm text-text-muted text-center">
                Instant to mobile wallets • HTG conversion • No bank required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="py-20 px-4 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15), transparent 60%)' }}></div>
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-4">Be First to Build Wealth with Every Transfer 🚀</h2>
          <p className="text-xl text-text-secondary mb-8">
            Get early access to StablePago — receive launch updates, referral rewards, and beta invites.
          </p>

          {!submitSuccess ? (
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-border bg-background px-6 py-4 text-lg text-white placeholder:text-text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all duration-200"
              />
              
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-6 py-4 text-lg text-white focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all duration-200"
              >
                <option value="">Select Country (Optional)</option>
                <option value="PR">🇵🇷 Puerto Rico</option>
                <option value="DO">🇩🇴 Dominican Republic</option>
                <option value="HT">🇭🇹 Haiti</option>
                <option value="US">🇺🇸 United States</option>
                <option value="OTHER">🌎 Other</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full text-lg py-4 glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Joining..." : "Join Wait-List"}
              </button>

              <p className="text-sm text-text-muted">
                We respect your inbox — no spams. You may unsubscribe anytime.
              </p>
            </form>
          ) : (
            <div className="card-arc p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 border-2 border-success mx-auto mb-4">
                <svg className="h-8 w-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">You're on the list! 🎉</h3>
              <p className="text-text-secondary">
                We'll notify you as soon as StablePago launches.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">🏦 Powered by Trusted Infrastructure</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Built on audited, enterprise-grade rails — non-custodial wallets by Crossmint, USDC payouts by Circle, and AI-powered voice assistance.
            </p>
          </div>

          {/* Partner Logos Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
            {["Circle", "Crossmint", "Uniswap", "CoinGecko", "ElevenLabs"].map((partner, idx) => (
              <div key={idx} className="flex items-center justify-center p-6 rounded-xl bg-surface-elevated border border-border hover:border-border-hover transition-all duration-200 hover:scale-105">
                <span className="text-text-secondary font-bold text-sm text-center">{partner}</span>
              </div>
            ))}
          </div>

          {/* Detailed Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "⭕", title: "Circle · USDC & CCTP", desc: "USDC issuance & chain-bridge via Circle and Cross-Chain Transfer Protocol", color: "primary" },
              { icon: "⚡", title: "Crossmint · Smart Wallets", desc: "Non-custodial wallet infrastructure with Web2-friendly email authentication", color: "secondary" },
              { icon: "🔄", title: "Uniswap · DeFi Access", desc: "Token swapping & RWA asset access through battle-tested DEX protocols", color: "warning" },
              { icon: "📊", title: "CoinGecko · Market Data", desc: "Real-time pricing, RWA token discovery, and portfolio tracking APIs", color: "secondary" },
              { icon: "🎙️", title: "ElevenLabs · Voice AI", desc: "Natural language processing for bilingual voice commands via Telegram", color: "primary" }
            ].map((partner, idx) => (
              <div key={idx} className="card-arc p-6 flex items-start gap-4 hover:scale-[1.02] transition-all duration-200">
                <div className="text-4xl flex-shrink-0">{partner.icon}</div>
                <div>
                  <h3 className={`text-lg font-bold mb-2 text-${partner.color}`}>{partner.title}</h3>
                  <p className="text-sm text-text-secondary">{partner.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><a href="#solution" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#solution" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#solution" className="hover:text-white transition-colors">Wealth Tools</a></li>
                <li><a href="/home" className="hover:text-white transition-colors">Wallet</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><a href="mailto:info@stablepago.com" className="hover:text-white transition-colors">info@stablepago.com</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              © 2025 StablePago LLC · All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-secondary hover:text-primary transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-secondary hover:text-primary transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.197-.054-.308-.346-.11l-6.4 4.02-2.76-.918c-.6-.183-.612-.6.126-.89l10.782-4.156c.5-.18.943.11.778.89z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

