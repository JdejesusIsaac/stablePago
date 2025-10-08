"use client";

import React, { useState } from "react";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { PrimaryButton } from "../common/PrimaryButton";
import { Modal } from "../common/Modal";

interface DelegationSetupProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TELEGRAM_BOT_ADDRESS = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ADDRESS || "";
const DEFAULT_DURATION_DAYS = 30;

export function DelegationSetup({ open, onClose, onSuccess }: DelegationSetupProps) {
  const { wallet } = useWallet();
  const { user } = useAuth();
  
  const [step, setStep] = useState<"configure" | "confirm" | "processing" | "success" | "error">("configure");
  const [error, setError] = useState<string | null>(null);
  
  // Spending limits
  const [dailyLimit, setDailyLimit] = useState("50");
  const [weeklyLimit, setWeeklyLimit] = useState("150");
  const [perItemLimit, setPerItemLimit] = useState("30");
  const [approvalThreshold, setApprovalThreshold] = useState("40");
  const [duration, setDuration] = useState("30"); // days
  
  // Categories
  const [allowedCategories, setAllowedCategories] = useState<string[]>(["grocery", "pharmacy"]);

  const categories = [
    { id: "grocery", label: "🛒 Grocery" },
    { id: "pharmacy", label: "💊 Pharmacy" },
    { id: "restaurant", label: "🍔 Restaurant" },
    { id: "retail", label: "🏪 Retail" },
  ];

  const toggleCategory = (categoryId: string) => {
    if (allowedCategories.includes(categoryId)) {
      setAllowedCategories(allowedCategories.filter((c) => c !== categoryId));
    } else {
      setAllowedCategories([...allowedCategories, categoryId]);
    }
  };

  const handleSetupDelegation = async () => {
    try {
      setError(null);
      setStep("processing");

      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      if (!TELEGRAM_BOT_ADDRESS) {
        throw new Error("Bot address not configured");
      }

      // Check if bot is already delegated
      const existingSigners = await wallet.delegatedSigners();
      const isAlreadyDelegated = existingSigners.some(
        (s: any) => s.signer.toLowerCase() === TELEGRAM_BOT_ADDRESS.toLowerCase()
      );

      if (!isAlreadyDelegated) {
        // Add bot as delegated signer (Correct Crossmint API!)
        await wallet.addDelegatedSigner({ 
          signer: TELEGRAM_BOT_ADDRESS 
        });
      }

      // Calculate expiry (for Supabase only)
      const validUntil = Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000;

      // Save delegation metadata to Supabase
      // (Spending limits are enforced by bot checking Supabase, not by Crossmint)
      const response = await fetch("/api/delegation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          bot_address: TELEGRAM_BOT_ADDRESS,
          daily_limit: parseFloat(dailyLimit),
          weekly_limit: parseFloat(weeklyLimit),
          per_item_limit: parseFloat(perItemLimit),
          approval_threshold: parseFloat(approvalThreshold),
          allowed_categories: allowedCategories,
          valid_until: new Date(validUntil).toISOString(),
          delegation_id: "active", // Crossmint doesn't return an ID
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save delegation settings");
      }

      setStep("success");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Delegation error:", err);
      const errorMessage = err.message || "Failed to setup delegation";
      
      // Check if error is "already delegated" - treat as success
      if (errorMessage.toLowerCase().includes('already') || 
          errorMessage.toLowerCase().includes('delegated')) {
        console.log("Bot signer already delegated - treating as success");
        setStep("success");
        if (onSuccess) onSuccess();
      } else {
        setError(errorMessage);
        setStep("error");
      }
    }
  };

  const handleClose = () => {
    setStep("configure");
    setError(null);
    onClose();
  };

  const isValid =
    parseFloat(dailyLimit) > 0 &&
    parseFloat(weeklyLimit) >= parseFloat(dailyLimit) &&
    parseFloat(perItemLimit) <= parseFloat(dailyLimit) &&
    parseFloat(approvalThreshold) > 0 &&
    allowedCategories.length > 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      showBackButton={step === "configure" || step === "confirm"}
      onBack={() => setStep(step === "confirm" ? "configure" : "configure")}
      title="Enable Telegram Shopping"
    >
      {step === "configure" && (
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            🤖 <strong>Telegram Bot Shopping</strong>
            <br />
            Allow the Telegram bot to make purchases on your behalf with these limits.
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Daily Limit (USD)</label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2"
              placeholder="50.00"
              min="1"
              step="1"
            />
            <div className="text-xs text-slate-500">Maximum spending per day</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Weekly Limit (USD)</label>
            <input
              type="number"
              value={weeklyLimit}
              onChange={(e) => setWeeklyLimit(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2"
              placeholder="150.00"
              min={dailyLimit}
              step="1"
            />
            <div className="text-xs text-slate-500">Maximum spending per week</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Per Item Limit (USD)</label>
            <input
              type="number"
              value={perItemLimit}
              onChange={(e) => setPerItemLimit(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2"
              placeholder="30.00"
              min="1"
              max={dailyLimit}
              step="1"
            />
            <div className="text-xs text-slate-500">Maximum price per single item</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Approval Required Above (USD)
            </label>
            <input
              type="number"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2"
              placeholder="40.00"
              min="1"
              step="1"
            />
            <div className="text-xs text-slate-500">
              Purchases above this amount need your approval
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Allowed Categories</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`rounded-lg border-2 p-3 text-left transition ${
                    allowedCategories.includes(cat.id)
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              Bot can only buy from selected categories
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Duration (Days)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
            <div className="text-xs text-slate-500">
              How long should this delegation last?
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">Summary</div>
            <div className="space-y-1 text-sm text-slate-600">
              <div>
                • Daily: <strong>${dailyLimit}</strong>
              </div>
              <div>
                • Weekly: <strong>${weeklyLimit}</strong>
              </div>
              <div>
                • Per Item: <strong>${perItemLimit}</strong>
              </div>
              <div>
                • Approval needed: <strong>${approvalThreshold}+</strong>
              </div>
              <div>
                • Categories: <strong>{allowedCategories.join(", ")}</strong>
              </div>
              <div>
                • Valid for: <strong>{duration} days</strong>
              </div>
            </div>
          </div>

          <PrimaryButton disabled={!isValid} onClick={() => setStep("confirm")}>
            Continue
          </PrimaryButton>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            ⚠️ <strong>Confirm Delegation</strong>
            <br />
            You're about to allow the Telegram bot to make purchases up to ${weeklyLimit}/week
            on your behalf. You can revoke this anytime.
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Bot Address:</span>
              <span className="font-mono text-xs text-slate-900">
                {TELEGRAM_BOT_ADDRESS.slice(0, 6)}...{TELEGRAM_BOT_ADDRESS.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Weekly Limit:</span>
              <span className="font-semibold text-slate-900">${weeklyLimit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Duration:</span>
              <span className="font-semibold text-slate-900">{duration} days</span>
            </div>
          </div>

          <PrimaryButton onClick={handleSetupDelegation}>
            Confirm & Enable Shopping
          </PrimaryButton>
        </div>
      )}

      {step === "processing" && (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              Setting up delegation...
            </div>
            <div className="text-sm text-slate-500">
              Granting bot permission to shop on your behalf
            </div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="text-center">
            <div className="mb-2 text-xl font-bold text-slate-900">
              Telegram Shopping Enabled! 🎉
            </div>
            <div className="mb-4 text-sm text-slate-600">
              You can now shop via Telegram bot with these limits:
            </div>
            <div className="mb-4 text-left text-sm text-slate-600">
              • Up to ${perItemLimit} per item
              <br />
              • Up to ${dailyLimit} per day
              <br />
              • Up to ${weeklyLimit} per week
              <br />• Approval needed for ${approvalThreshold}+
            </div>
            <div className="text-xs text-slate-500">
              You can manage or revoke this anytime in settings
            </div>
          </div>
          <PrimaryButton onClick={handleClose}>Done</PrimaryButton>
        </div>
      )}

      {step === "error" && (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div className="text-center">
            <div className="mb-2 text-xl font-bold text-slate-900">Setup Failed</div>
            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
          </div>
          <PrimaryButton onClick={() => setStep("configure")}>Try Again</PrimaryButton>
        </div>
      )}
    </Modal>
  );
}

