"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { Modal } from "../common/Modal";
import { PrimaryButton } from "../common/PrimaryButton";

interface DelegationManagerProps {
  open: boolean;
  onClose: () => void;
  onSetupNew: () => void;
}

interface Delegation {
  id: string;
  bot_address: string;
  daily_limit: number;
  weekly_limit: number;
  per_item_limit: number;
  approval_threshold: number;
  allowed_categories: string[];
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export function DelegationManager({ open, onClose, onSetupNew }: DelegationManagerProps) {
  const { wallet } = useWallet();
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      loadDelegations();
    }
  }, [open, user]);

  const loadDelegations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delegation/list?user_id=${user?.id}`);
      const data = await response.json();
      setDelegations(data.delegations || []);
    } catch (error) {
      console.error("Failed to load delegations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (delegationId: string, botAddress: string) => {
    if (!confirm("Are you sure you want to revoke Telegram shopping access? You'll need to visit your wallet settings to fully remove the delegated signer.")) {
      return;
    }

    try {
      setRevoking(delegationId);

      // Note: Crossmint doesn't provide a direct API to remove delegated signers
      // User must manually remove via wallet settings or smart contract
      // We only mark as inactive in our database to stop the bot from using it
      
      // Mark as revoked in database
      await fetch("/api/delegation/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delegation_id: delegationId }),
      });

      // Reload list
      await loadDelegations();
      
      alert("Delegation revoked in StablePago. For complete removal, please remove the delegated signer from your wallet settings.");
    } catch (error: any) {
      console.error("Failed to revoke:", error);
      alert(`Failed to revoke: ${error.message}`);
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const activeDelegations = delegations.filter((d) => d.is_active && !isExpired(d.valid_until));
  const inactiveDelegations = delegations.filter(
    (d) => !d.is_active || isExpired(d.valid_until)
  );

  return (
    <Modal open={open} onClose={onClose} title="Manage Telegram Shopping">
      <div className="flex w-full flex-col gap-4">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Active Delegations */}
            {activeDelegations.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700">Active</div>
                {activeDelegations.map((delegation) => (
                  <div
                    key={delegation.id}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                          🤖
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Telegram Shopping Bot
                          </div>
                          <div className="text-xs text-slate-500">
                            Active until {formatDate(delegation.valid_until)}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-medium text-white">
                        Active
                      </span>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-slate-500">Daily Limit</div>
                        <div className="font-semibold text-slate-900">
                          ${delegation.daily_limit}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Weekly Limit</div>
                        <div className="font-semibold text-slate-900">
                          ${delegation.weekly_limit}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Per Item</div>
                        <div className="font-semibold text-slate-900">
                          ${delegation.per_item_limit}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Approval At</div>
                        <div className="font-semibold text-slate-900">
                          ${delegation.approval_threshold}+
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 text-xs text-slate-600">
                      <strong>Categories:</strong> {delegation.allowed_categories.join(", ")}
                    </div>

                    <button
                      onClick={() => handleRevoke(delegation.id, delegation.bot_address)}
                      disabled={revoking === delegation.id}
                      className="w-full rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                    >
                      {revoking === delegation.id ? "Revoking..." : "Revoke Access"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-8 text-center">
                <div className="mb-2 text-4xl">🤖</div>
                <div className="mb-2 text-sm font-semibold text-slate-900">
                  No Active Delegation
                </div>
                <div className="mb-4 text-xs text-slate-600">
                  Enable Telegram shopping to let the bot make purchases on your behalf
                </div>
                <PrimaryButton onClick={onSetupNew}>Enable Telegram Shopping</PrimaryButton>
              </div>
            )}

            {/* Inactive/Expired Delegations */}
            {inactiveDelegations.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700">History</div>
                {inactiveDelegations.map((delegation) => (
                  <div
                    key={delegation.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 opacity-60"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500">
                          {isExpired(delegation.valid_until) ? "Expired" : "Revoked"}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(delegation.created_at)}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      Limits: ${delegation.daily_limit}/day, ${delegation.weekly_limit}/week
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Setup New Button (if has active) */}
            {activeDelegations.length > 0 && (
              <button
                onClick={onSetupNew}
                className="w-full rounded-lg border-2 border-dashed border-slate-300 p-4 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
              >
                + Setup New Delegation
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

