"use client";

import { useState } from "react";
import { Modal } from "./common/Modal";
import { PrimaryButton } from "./common/PrimaryButton";

interface CreateWalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWalletModal({ open, onClose }: CreateWalletModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdWallet, setCreatedWallet] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCreateWallet = async () => {
    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/create-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create wallet");
      }

      setCreatedWallet(data.walletAddress);
      setSuccess(true);
    } catch (err: any) {
      console.error("Error creating wallet:", err);
      setError(err.message || "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError(null);
    setSuccess(false);
    setCreatedWallet(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Wallet for Recipient">
      <div className="flex w-full flex-col gap-4">
        {!success ? (
          <>
            <div className="rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 p-4 text-sm text-[#00F0FF]">
              💡 <strong>Create a wallet for someone</strong>
              <br />
              <span className="text-[#A9B0B7]">Enter their email to create a Crossmint wallet for them. They can access it by
              logging in with their email.</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#A9B0B7]">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="grandma@example.com"
                className="rounded-xl border border-[#2A2D32] bg-[#0B0C10] px-4 py-3 text-base text-white placeholder:text-[#6B7280] focus:border-[#FF005C] focus:outline-none focus:ring-2 focus:ring-[#FF005C]/20 transition-all duration-200"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleCreateWallet();
                  }
                }}
              />
              <div className="text-xs text-[#6B7280]">
                They'll be able to login with this email to access their wallet
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-[#FF005C]/10 border border-[#FF005C]/30 p-3 text-sm text-[#FF005C]">{error}</div>
            )}

            <PrimaryButton onClick={handleCreateWallet} disabled={loading || !email}>
              {loading ? "Creating Wallet..." : "Create Wallet"}
            </PrimaryButton>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00F0FF]/20 border-2 border-[#00F0FF]">
              <svg
                className="h-8 w-8 text-[#00F0FF]"
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
              <div className="mb-2 text-xl font-bold text-white">Wallet Created! 🎉</div>
              <div className="mb-4 text-sm text-[#A9B0B7]">
                A wallet has been created for <strong className="text-white">{email}</strong>
              </div>

              {createdWallet && (
                <div className="mb-4 rounded-xl bg-[#0B0C10] border border-[#2A2D32] p-3">
                  <div className="mb-1 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Wallet Address</div>
                  <div className="font-mono text-xs text-white break-all">
                    {createdWallet}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 p-3 text-sm text-[#00F0FF]">
                ✅ <span className="text-[#A9B0B7]">They can now receive funds! Send USDC to <strong className="text-white">{email}</strong> and it will
                arrive in their wallet.</span>
              </div>
            </div>

            <PrimaryButton onClick={handleClose}>Done</PrimaryButton>
          </div>
        )}
      </div>
    </Modal>
  );
}

