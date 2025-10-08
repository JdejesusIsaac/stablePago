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
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              💡 <strong>Create a wallet for someone</strong>
              <br />
              Enter their email to create a Crossmint wallet for them. They can access it by
              logging in with their email.
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="grandma@example.com"
                className="rounded-lg border border-slate-300 px-4 py-3 text-base"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleCreateWallet();
                  }
                }}
              />
              <div className="text-xs text-slate-500">
                They'll be able to login with this email to access their wallet
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <PrimaryButton onClick={handleCreateWallet} disabled={loading || !email}>
              {loading ? "Creating Wallet..." : "Create Wallet"}
            </PrimaryButton>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
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
              <div className="mb-2 text-xl font-bold text-slate-900">Wallet Created! 🎉</div>
              <div className="mb-4 text-sm text-slate-600">
                A wallet has been created for <strong>{email}</strong>
              </div>

              {createdWallet && (
                <div className="mb-4 rounded-lg bg-slate-50 p-3">
                  <div className="mb-1 text-xs font-medium text-slate-500">Wallet Address</div>
                  <div className="font-mono text-xs text-slate-900 break-all">
                    {createdWallet}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                ✅ They can now receive funds! Send USDC to <strong>{email}</strong> and it will
                arrive in their wallet.
              </div>
            </div>

            <PrimaryButton onClick={handleClose}>Done</PrimaryButton>
          </div>
        )}
      </div>
    </Modal>
  );
}

