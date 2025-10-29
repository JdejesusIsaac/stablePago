"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { ChartBarIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface DelegationCardProps {
  onManageClick: () => void;
  onSetupClick: () => void;
}

interface Delegation {
  id: string;
  delegation_type?: string; // "auto_invest" or "family_wallet"
  daily_limit: number;
  weekly_limit?: number;
  monthly_limit?: number;
  per_item_limit?: number;
  recipient_name?: string;
  withdraw_only?: boolean;
  investment_allocation?: string[];
  is_active: boolean;
  valid_until: string;
}

export function DelegationCard({ onManageClick, onSetupClick }: DelegationCardProps) {
  const { user } = useAuth();
  const [delegation, setDelegation] = useState<Delegation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDelegation();
    }
  }, [user]);

  const loadDelegation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delegation/list?user_id=${user?.id}`);
      const data = await response.json();
      
      // Get the most recent active delegation
      const activeDelegations = data.delegations?.filter(
        (d: Delegation) => d.is_active && new Date(d.valid_until) > new Date()
      ) || [];
      
      setDelegation(activeDelegations[0] || null);
    } catch (error) {
      console.error("Failed to load delegation:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-arc p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated">
            <ChartBarIcon className="h-6 w-6 text-text-muted" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-surface-elevated"></div>
            <div className="mt-1 h-3 w-24 animate-pulse rounded bg-border"></div>
          </div>
        </div>
      </div>
    );
  }

  const isAutoInvest = delegation?.delegation_type === "auto_invest";
  const isFamilyWallet = delegation?.delegation_type === "family_wallet";

  if (delegation) {
    // Active delegation - Arc Network Style
    const Icon = isAutoInvest ? ChartBarIcon : UserGroupIcon;
    const primaryColor = isAutoInvest ? "primary" : "secondary";
    const title = isAutoInvest ? "Auto-Investment" : "Family Wallet";
    const subtitle = isAutoInvest ? "Building Wealth Automatically" : delegation.recipient_name || "Shared Access";
    
    return (
      <div className="card-arc p-6 relative overflow-hidden">
        {/* Arc Glow Effect */}
        <div className={`absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl pointer-events-none ${
          isAutoInvest ? "bg-primary" : "bg-secondary"
        }`}></div>
        
        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                isAutoInvest
                  ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 glow-primary"
                  : "bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 glow-secondary"
              }`}>
                <Icon className={`h-7 w-7 ${isAutoInvest ? "text-primary" : "text-secondary"}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-text-secondary">{subtitle}</p>
              </div>
            </div>
            <span className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              isAutoInvest
                ? "bg-primary/20 border border-primary/30 text-primary"
                : "bg-secondary/20 border border-secondary/30 text-secondary"
            }`}>
              ✓ Active
            </span>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            {isAutoInvest ? (
              <>
                <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-primary/30 transition-all duration-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Daily</div>
                  <div className="text-2xl font-bold text-foreground">${delegation.daily_limit}</div>
                </div>
                <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-primary/30 transition-all duration-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Weekly</div>
                  <div className="text-2xl font-bold text-foreground">${delegation.weekly_limit || 0}</div>
                </div>
                <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-primary/30 transition-all duration-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Monthly</div>
                  <div className="text-2xl font-bold text-foreground">${delegation.monthly_limit || 0}</div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-secondary/30 transition-all duration-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Daily Limit</div>
                  <div className="text-2xl font-bold text-foreground">${delegation.daily_limit}</div>
                </div>
                <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-secondary/30 transition-all duration-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Mode</div>
                  <div className="text-sm font-bold text-foreground mt-2">{delegation.withdraw_only ? "Withdraw" : "Full Access"}</div>
                </div>
                <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-secondary/30 transition-all duration-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Status</div>
                  <div className="text-sm font-bold text-success mt-2">Active</div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onManageClick}
            className="btn-secondary w-full"
          >
            Manage Limits
          </button>
        </div>
      </div>
    );
  }

  // No delegation - Arc Network Setup CTA
  return (
    <div className="card-arc p-6 relative overflow-hidden">
      {/* Arc Glow Effect */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 glow-primary">
              <ChartBarIcon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Wealth Automation</h3>
              <p className="text-sm text-text-secondary">Auto-invest & delegate access</p>
            </div>
          </div>
          <span className="rounded-xl bg-border border border-border-hover px-3 py-1.5 text-xs font-bold text-text-muted uppercase tracking-wide">
            Not Set Up
          </span>
        </div>

        <p className="mb-6 text-sm text-text-secondary leading-relaxed">
          Transform remittances into lasting wealth. Set up automated investments in RWA tokens (gold, treasuries) or create a secure family wallet for loved ones—all powered by your Telegram bot.
        </p>

        {/* Feature highlights */}
        <div className="mb-6 space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-surface-elevated border border-border p-3">
            <div className="text-2xl">📈</div>
            <div>
              <div className="text-sm font-semibold text-white">Auto-Investment</div>
              <div className="text-xs text-text-muted">Dollar-Cost Average into PAXG, ONDO, USDC</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-surface-elevated border border-border p-3">
            <div className="text-2xl">👨‍👩‍👧</div>
            <div>
              <div className="text-sm font-semibold text-white">Family Wallet</div>
              <div className="text-xs text-text-muted">Controlled access for elderly parents or family</div>
            </div>
          </div>
        </div>

        <button
          onClick={onSetupClick}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Enable Wealth Automation
        </button>
      </div>
    </div>
  );
}

