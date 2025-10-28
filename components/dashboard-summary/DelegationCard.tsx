"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";

interface DelegationCardProps {
  onManageClick: () => void;
  onSetupClick: () => void;
}

interface Delegation {
  id: string;
  daily_limit: number;
  weekly_limit: number;
  per_item_limit: number;
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <ShoppingBagIcon className="h-6 w-6 text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200"></div>
            <div className="mt-1 h-3 w-24 animate-pulse rounded bg-slate-100"></div>
          </div>
        </div>
      </div>
    );
  }

  if (delegation) {
    // Active delegation - Arc Network Style
    return (
      <div className="card-arc p-6 relative overflow-hidden">
        {/* Arc Glow Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-success opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 glow-secondary">
                <ShoppingBagIcon className="h-7 w-7 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Telegram Shopping</h3>
                <p className="text-sm text-text-secondary">Active & Ready</p>
              </div>
            </div>
            <span className="rounded-xl bg-success/20 border border-success/30 px-3 py-1.5 text-xs font-bold text-success uppercase tracking-wide">
              ✓ Active
            </span>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-success/30 transition-all duration-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Daily</div>
              <div className="text-2xl font-bold text-foreground">${delegation.daily_limit}</div>
            </div>
            <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-success/30 transition-all duration-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Weekly</div>
              <div className="text-2xl font-bold text-foreground">${delegation.weekly_limit}</div>
            </div>
            <div className="rounded-xl bg-surface-elevated border border-border p-4 hover:border-success/30 transition-all duration-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Per Item</div>
              <div className="text-2xl font-bold text-foreground">${delegation.per_item_limit}</div>
            </div>
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
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 glow-primary">
            <ShoppingBagIcon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Telegram Shopping</h3>
            <p className="text-sm text-text-secondary">Shop via Telegram bot</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-text-secondary leading-relaxed">
          Let your Telegram bot make purchases on your behalf with spending limits you control. Set daily, weekly, and per-item limits for secure automated shopping.
        </p>

        <button
          onClick={onSetupClick}
          className="btn-primary w-full"
        >
          Enable Shopping Bot
        </button>
      </div>
    </div>
  );
}

