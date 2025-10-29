"use client";

import React, { useState } from "react";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { PrimaryButton } from "../common/PrimaryButton";
import { Modal } from "../common/Modal";

interface DelegationSetupProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  previewMode?: boolean; // If true, show UI but disable confirmation
}

const TELEGRAM_BOT_ADDRESS = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ADDRESS || "";
const DEFAULT_DURATION_DAYS = 30;

export function DelegationSetup({ open, onClose, onSuccess, previewMode = true }: DelegationSetupProps) {
  const { wallet } = useWallet();
  const { user } = useAuth();
  
  const [step, setStep] = useState<"configure" | "confirm" | "processing" | "success" | "error">("configure");
  const [error, setError] = useState<string | null>(null);
  
  // Delegation type selection
  const [delegationType, setDelegationType] = useState<"auto-invest" | "family-wallet">("auto-invest");
  
  // Investment limits (for auto-invest)
  const [dailyLimit, setDailyLimit] = useState("20");
  const [weeklyLimit, setWeeklyLimit] = useState("100");
  const [monthlyLimit, setMonthlyLimit] = useState("400");
  const [approvalThreshold, setApprovalThreshold] = useState("50");
  const [duration, setDuration] = useState("90"); // days
  
  // Investment allocation (for auto-invest)
  const [investmentAllocation, setInvestmentAllocation] = useState<string[]>(["usdc", "paxg"]);

  // Family delegation (for family-wallet)
  const [withdrawOnlyMode, setWithdrawOnlyMode] = useState(true);
  const [dailyWithdrawLimit, setDailyWithdrawLimit] = useState("50");
  const [recipientName, setRecipientName] = useState("");

  const investmentAssets = [
    { id: "usdc", label: "💵 USDC Savings", description: "Dollar-denominated savings vault" },
    { id: "paxg", label: "🏆 Gold (PAXG)", description: "Inflation hedge" },
    { id: "ondo", label: "📊 Treasuries (ONDO)", description: "4-5% APY safe yield" },
    { id: "usyc", label: "🏛️ US Yield Coin", description: "Treasury-backed stablecoin" },
  ];

  const toggleAsset = (assetId: string) => {
    if (investmentAllocation.includes(assetId)) {
      setInvestmentAllocation(investmentAllocation.filter((c) => c !== assetId));
    } else {
      setInvestmentAllocation([...investmentAllocation, assetId]);
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
      const delegationData = delegationType === "auto-invest" ? {
        user_id: user?.id,
        bot_address: TELEGRAM_BOT_ADDRESS,
        delegation_type: "auto_invest",
        daily_limit: parseFloat(dailyLimit),
        weekly_limit: parseFloat(weeklyLimit),
        monthly_limit: parseFloat(monthlyLimit),
        approval_threshold: parseFloat(approvalThreshold),
        investment_allocation: investmentAllocation,
        valid_until: new Date(validUntil).toISOString(),
        delegation_id: "active",
      } : {
        user_id: user?.id,
        bot_address: TELEGRAM_BOT_ADDRESS,
        delegation_type: "family_wallet",
        recipient_name: recipientName,
        withdraw_only: withdrawOnlyMode,
        daily_limit: parseFloat(dailyWithdrawLimit),
        valid_until: new Date(validUntil).toISOString(),
        delegation_id: "active",
      };

      const response = await fetch("/api/delegation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delegationData),
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

  const isValid = delegationType === "auto-invest"
    ? parseFloat(dailyLimit) > 0 &&
      parseFloat(weeklyLimit) >= parseFloat(dailyLimit) &&
      parseFloat(monthlyLimit) >= parseFloat(weeklyLimit) &&
      parseFloat(approvalThreshold) > 0 &&
      investmentAllocation.length > 0
    : recipientName.trim().length > 0 &&
      parseFloat(dailyWithdrawLimit) > 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      showBackButton={step === "configure" || step === "confirm"}
      onBack={() => {
        if (step === "confirm") {
          setStep("configure"); // Go back to configure from confirm
        } else {
          handleClose(); // Close modal and return to dashboard from configure
        }
      }}
      title="Enable Wealth Automation"
    >
      {step === "configure" && (
        <div className="flex w-full flex-col gap-6">
          {/* Delegation Type Selection */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-white uppercase tracking-wide">
              Choose Delegation Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDelegationType("auto-invest")}
                className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  delegationType === "auto-invest"
                    ? "border-[#FF005C] bg-[#FF005C]/10 shadow-glow-primary"
                    : "border-[#2A2D32] bg-[#1C1F24] hover:border-[#42454A]"
                }`}
              >
                <div className="text-2xl mb-2">📈</div>
                <div className={`font-semibold ${delegationType === "auto-invest" ? "text-[#FF005C]" : "text-white"}`}>
                  Auto-Invest
                </div>
                <div className="text-xs text-[#A9B0B7] mt-1">
                  Automate wealth building with RWA tokens
                </div>
              </button>
              
              <button
                onClick={() => setDelegationType("family-wallet")}
                className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  delegationType === "family-wallet"
                    ? "border-[#00F0FF] bg-[#00F0FF]/10 shadow-glow-secondary"
                    : "border-[#2A2D32] bg-[#1C1F24] hover:border-[#42454A]"
                }`}
              >
                <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                <div className={`font-semibold ${delegationType === "family-wallet" ? "text-[#00F0FF]" : "text-white"}`}>
                  Family Wallet
                </div>
                <div className="text-xs text-[#A9B0B7] mt-1">
                  Share access with family members
                </div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className={`rounded-xl border p-4 text-sm ${
            delegationType === "auto-invest"
              ? "bg-[#FF005C]/10 border-[#FF005C]/30 text-[#FF005C]"
              : "bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]"
          }`}>
            {delegationType === "auto-invest" ? (
              <>
                <strong>💰 Auto-Investment Delegation</strong>
                <br />
                <span className="text-[#A9B0B7]">
                  Allow the Telegram bot to automatically invest in RWA tokens (gold, treasuries) on your behalf using Dollar-Cost Averaging. Build wealth passively while you focus on life.
                </span>
              </>
            ) : (
              <>
                <strong>👨‍👩‍👧 Family Wallet Delegation</strong>
                <br />
                <span className="text-[#A9B0B7]">
                  Create a controlled wallet for family members (e.g., elderly parents) to withdraw funds for daily needs while maintaining oversight and spending limits.
                </span>
              </>
            )}
          </div>

          {/* Auto-Investment Form */}
          {delegationType === "auto-invest" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Daily Investment Limit (USD)</label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="rounded-xl border border-[#2A2D32] bg-[#0B0C10] px-4 py-3 text-base text-white placeholder:text-[#6B7280] focus:border-[#FF005C] focus:outline-none focus:ring-2 focus:ring-[#FF005C]/20"
                  placeholder="20"
                  min="1"
                  step="1"
                />
                <div className="text-xs text-[#6B7280]">Maximum amount to invest per day</div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Weekly Investment Limit (USD)</label>
                <input
                  type="number"
                  value={weeklyLimit}
                  onChange={(e) => setWeeklyLimit(e.target.value)}
                  className="rounded-xl border border-[#2A2D32] bg-[#0B0C10] px-4 py-3 text-base text-white placeholder:text-[#6B7280] focus:border-[#FF005C] focus:outline-none focus:ring-2 focus:ring-[#FF005C]/20"
                  placeholder="100"
                  min={dailyLimit}
                  step="1"
                />
                <div className="text-xs text-[#6B7280]">Maximum amount to invest per week</div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Monthly Investment Limit (USD)</label>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="rounded-xl border border-[#2A2D32] bg-[#0B0C10] px-4 py-3 text-base text-white placeholder:text-[#6B7280] focus:border-[#FF005C] focus:outline-none focus:ring-2 focus:ring-[#FF005C]/20"
                  placeholder="400"
                  min={weeklyLimit}
                  step="1"
                />
                <div className="text-xs text-[#6B7280]">Maximum amount to invest per month</div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">
                  Approval Required Above (USD)
                </label>
                <input
                  type="number"
                  value={approvalThreshold}
                  onChange={(e) => setApprovalThreshold(e.target.value)}
                  className="rounded-xl border border-[#2A2D32] bg-[#0B0C10] px-4 py-3 text-base text-white placeholder:text-[#6B7280] focus:border-[#FF005C] focus:outline-none focus:ring-2 focus:ring-[#FF005C]/20"
                  placeholder="50"
                  min="1"
                  step="1"
                />
                <div className="text-xs text-[#6B7280]">
                  Investments above this amount need your approval
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-white">Investment Assets</label>
                <div className="grid grid-cols-1 gap-3">
                  {investmentAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => toggleAsset(asset.id)}
                      className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                        investmentAllocation.includes(asset.id)
                          ? "border-[#FF005C] bg-[#FF005C]/10"
                          : "border-[#2A2D32] bg-[#1C1F24] hover:border-[#42454A]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{asset.label.split(" ")[0]}</div>
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            investmentAllocation.includes(asset.id) ? "text-[#FF005C]" : "text-white"
                          }`}>
                            {asset.label.substring(asset.label.indexOf(" ") + 1)}
                          </div>
                          <div className="text-xs text-[#A9B0B7] mt-1">{asset.description}</div>
                        </div>
                        {investmentAllocation.includes(asset.id) && (
                          <div className="text-[#FF005C]">✓</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-[#6B7280]">
                  Bot will automatically invest in selected assets using Dollar-Cost Averaging
                </div>
              </div>
            </>
          )}

          {/* Family Wallet Form */}
          {delegationType === "family-wallet" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Recipient Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="rounded-xl border border-[#2A2D32] bg-[#0B0C10] px-4 py-3 text-base text-white placeholder:text-[#6B7280] focus:border-[#00F0FF] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/20"
                  placeholder="e.g., Grandma Maria"
                  maxLength={50}
                />
                <div className="text-xs text-[#6B7280]">Who will have access to this wallet?</div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white">Daily Withdrawal Limit (USD)</label>
                <input
                  type="number"
                  value={dailyWithdrawLimit}
                  onChange={(e) => setDailyWithdrawLimit(e.target.value)}
                  className="rounded-xl border border-[#2A2D32] bg-[#0B0C10] px-4 py-3 text-base text-white placeholder:text-[#6B7280] focus:border-[#00F0FF] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/20"
                  placeholder="50"
                  min="1"
                  step="1"
                />
                <div className="text-xs text-[#6B7280]">Maximum amount they can withdraw per day</div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#2A2D32] bg-[#1C1F24] p-4">
                <input
                  type="checkbox"
                  id="withdraw-only"
                  checked={withdrawOnlyMode}
                  onChange={(e) => setWithdrawOnlyMode(e.target.checked)}
                  className="h-5 w-5 rounded border-[#2A2D32] bg-[#0B0C10] text-[#00F0FF] focus:ring-[#00F0FF]"
                />
                <label htmlFor="withdraw-only" className="flex-1 text-sm text-white cursor-pointer">
                  <strong>Withdraw-Only Mode</strong>
                  <div className="text-xs text-[#A9B0B7] mt-1">
                    They can only withdraw to their bank account. No transfers or investments.
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-white">Duration (Days)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="rounded-xl border border-[#2A2D32] bg-[#0B0C10] px-4 py-3 text-base text-white focus:border-[#FF005C] focus:outline-none focus:ring-2 focus:ring-[#FF005C]/20"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days (Recommended for wealth building)</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </select>
            <div className="text-xs text-[#6B7280]">
              How long should this delegation remain active?
            </div>
          </div>

          {/* Summary Box */}
          <div className="rounded-xl bg-[#1C1F24] border border-[#2A2D32] p-4">
            <div className="mb-3 text-sm font-semibold text-white uppercase tracking-wide">
              📋 Configuration Summary
            </div>
            <div className="space-y-2 text-sm text-[#A9B0B7]">
              {delegationType === "auto-invest" ? (
                <>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <strong className="text-[#FF005C]">Auto-Investment</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Limit:</span>
                    <strong className="text-white">${dailyLimit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Limit:</span>
                    <strong className="text-white">${weeklyLimit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Limit:</span>
                    <strong className="text-white">${monthlyLimit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Approval Above:</span>
                    <strong className="text-white">${approvalThreshold}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Assets:</span>
                    <strong className="text-white">{investmentAllocation.length} selected</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <strong className="text-white">{duration} days</strong>
                  </div>
                  {investmentAllocation.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#2A2D32]">
                      <div className="text-xs text-[#A9B0B7] mb-2">Selected Assets:</div>
                      <div className="flex flex-wrap gap-2">
                        {investmentAllocation.map(assetId => {
                          const asset = investmentAssets.find(a => a.id === assetId);
                          return asset ? (
                            <span key={assetId} className="px-2 py-1 rounded-lg bg-[#FF005C]/20 text-[#FF005C] text-xs font-medium">
                              {asset.label.split(" ")[0]} {asset.label.substring(asset.label.indexOf(" ") + 1).split(" ")[0]}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <strong className="text-[#00F0FF]">Family Wallet</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient:</span>
                    <strong className="text-white">{recipientName || "Not set"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Limit:</span>
                    <strong className="text-white">${dailyWithdrawLimit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <strong className="text-white">{withdrawOnlyMode ? "Withdraw-Only" : "Full Access"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <strong className="text-white">{duration} days</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {previewMode && (
            <div className="rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 p-4 text-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FFB800] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-semibold text-[#FFB800] mb-1">Preview Mode</div>
                  <div className="text-[#A9B0B7]">
                    This feature is currently in development. You can explore the interface, but delegation activation is temporarily disabled. Check back soon!
                  </div>
                </div>
              </div>
            </div>
          )}

          <PrimaryButton 
            disabled={!isValid || previewMode} 
            onClick={() => setStep("confirm")}
          >
            {previewMode ? "Coming Soon" : "Continue"}
          </PrimaryButton>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex w-full flex-col gap-6">
          <div className={`rounded-xl border p-4 text-sm ${
            delegationType === "auto-invest"
              ? "bg-[#FFB800]/10 border-[#FFB800]/30 text-[#FFB800]"
              : "bg-[#FFB800]/10 border-[#FFB800]/30 text-[#FFB800]"
          }`}>
            ⚠️ <strong>Confirm Delegation</strong>
            <br />
            <span className="text-[#A9B0B7]">
              {delegationType === "auto-invest" ? (
                <>You're about to enable automated wealth building. The Telegram bot will invest up to ${monthlyLimit}/month in your selected RWA assets. You can revoke this anytime.</>
              ) : (
                <>You're about to create a family wallet for {recipientName}. They will be able to withdraw up to ${dailyWithdrawLimit}/day. You can revoke this anytime.</>
              )}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center rounded-xl bg-[#1C1F24] border border-[#2A2D32] p-3">
              <span className="text-[#A9B0B7]">Bot Address:</span>
              <span className="font-mono text-xs text-white">
                {TELEGRAM_BOT_ADDRESS.slice(0, 6)}...{TELEGRAM_BOT_ADDRESS.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between items-center rounded-xl bg-[#1C1F24] border border-[#2A2D32] p-3">
              <span className="text-[#A9B0B7]">{delegationType === "auto-invest" ? "Monthly Limit" : "Daily Limit"}:</span>
              <span className="font-semibold text-white">
                ${delegationType === "auto-invest" ? monthlyLimit : dailyWithdrawLimit}
              </span>
            </div>
            <div className="flex justify-between items-center rounded-xl bg-[#1C1F24] border border-[#2A2D32] p-3">
              <span className="text-[#A9B0B7]">Duration:</span>
              <span className="font-semibold text-white">{duration} days</span>
            </div>
          </div>

          <PrimaryButton 
            disabled={previewMode} 
            onClick={handleSetupDelegation}
          >
            {previewMode 
              ? "Feature Coming Soon" 
              : delegationType === "auto-invest" 
                ? "Confirm & Enable Auto-Invest" 
                : "Confirm & Create Family Wallet"
            }
          </PrimaryButton>
        </div>
      )}

      {step === "processing" && (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF005C] border-t-transparent"></div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              Setting up delegation...
            </div>
            <div className="text-sm text-[#A9B0B7]">
              {delegationType === "auto-invest" 
                ? "Granting bot permission to invest on your behalf"
                : "Creating controlled family wallet access"
              }
            </div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-6">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${
            delegationType === "auto-invest"
              ? "bg-[#FF005C]/20 border-[#FF005C]"
              : "bg-[#00F0FF]/20 border-[#00F0FF]"
          }`}>
            <svg
              className={`h-10 w-10 ${delegationType === "auto-invest" ? "text-[#FF005C]" : "text-[#00F0FF]"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="text-center max-w-md">
            <div className="mb-3 text-2xl font-bold text-white">
              {delegationType === "auto-invest" ? "Auto-Invest Enabled! 🚀" : "Family Wallet Created! 👨‍👩‍👧"}
            </div>
            <div className="mb-4 text-base text-[#A9B0B7]">
              {delegationType === "auto-invest" ? (
                <>Your wealth automation is now active. The Telegram bot will automatically invest according to your configuration:</>
              ) : (
                <>{recipientName} can now access their wallet via Telegram with these protections:</>
              )}
            </div>
            <div className="mb-6 text-left text-sm rounded-xl bg-[#1C1F24] border border-[#2A2D32] p-4">
              {delegationType === "auto-invest" ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#FF005C]">•</span>
                    <span className="text-[#A9B0B7]">Up to <strong className="text-white">${dailyLimit}</strong> per day</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#FF005C]">•</span>
                    <span className="text-[#A9B0B7]">Up to <strong className="text-white">${weeklyLimit}</strong> per week</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#FF005C]">•</span>
                    <span className="text-[#A9B0B7]">Up to <strong className="text-white">${monthlyLimit}</strong> per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF005C]">•</span>
                    <span className="text-[#A9B0B7]">Your approval needed for <strong className="text-white">${approvalThreshold}+</strong></span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#00F0FF]">•</span>
                    <span className="text-[#A9B0B7]">Daily withdrawal limit: <strong className="text-white">${dailyWithdrawLimit}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#00F0FF]">•</span>
                    <span className="text-[#A9B0B7]">Mode: <strong className="text-white">{withdrawOnlyMode ? "Withdraw-Only" : "Full Access"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00F0FF]">•</span>
                    <span className="text-[#A9B0B7]">Valid for: <strong className="text-white">{duration} days</strong></span>
                  </div>
                </>
              )}
            </div>
            <div className="text-xs text-[#6B7280] mb-4">
              💡 You can manage or revoke this delegation anytime from your dashboard
            </div>
          </div>
          <PrimaryButton onClick={handleClose}>Done</PrimaryButton>
        </div>
      )}

      {step === "error" && (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF005C]/20 border-2 border-[#FF005C]">
            <svg
              className="h-8 w-8 text-[#FF005C]"
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
            <div className="mb-2 text-xl font-bold text-white">Setup Failed</div>
            {error && <div className="mb-4 text-sm text-[#FF005C] rounded-xl bg-[#FF005C]/10 border border-[#FF005C]/30 p-3">{error}</div>}
          </div>
          <PrimaryButton onClick={() => setStep("configure")}>Try Again</PrimaryButton>
        </div>
      )}
    </Modal>
  );
}

