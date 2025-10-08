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
    // Active delegation - show status
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <ShoppingBagIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Telegram Shopping</h3>
              <p className="text-xs text-slate-600">Active & Ready</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
            ✓ Active
          </span>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/60 p-2">
            <div className="text-xs text-slate-500">Daily</div>
            <div className="text-sm font-semibold text-slate-900">${delegation.daily_limit}</div>
          </div>
          <div className="rounded-lg bg-white/60 p-2">
            <div className="text-xs text-slate-500">Weekly</div>
            <div className="text-sm font-semibold text-slate-900">${delegation.weekly_limit}</div>
          </div>
          <div className="rounded-lg bg-white/60 p-2">
            <div className="text-xs text-slate-500">Per Item</div>
            <div className="text-sm font-semibold text-slate-900">${delegation.per_item_limit}</div>
          </div>
        </div>

        <button
          onClick={onManageClick}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Manage Limits
        </button>
      </div>
    );
  }

  // No delegation - show setup CTA
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
          <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Telegram Shopping</h3>
          <p className="text-xs text-slate-600">Shop via Telegram bot</p>
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-600">
        Let your Telegram bot make purchases on your behalf with spending limits you control.
      </p>

      <button
        onClick={onSetupClick}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Enable Shopping Bot
      </button>
    </div>
  );
}

