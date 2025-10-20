"use client";

import { useMemo, useState } from "react";
import networks from "@/data/networks.json";

import { Modal } from "./common/Modal";
import { PrimaryButton } from "./common/PrimaryButton";

interface CreateTelegramWalletModalProps {
  open: boolean;
  onClose: () => void;
}

type CreateWalletResult = {
  success: boolean;
  walletId: string;
  address: `0x${string}`;
  network: string;
  existingWallet?: boolean;
};

type NetworkKey = keyof typeof networks;

export function CreateTelegramWalletModal({ open, onClose }: CreateTelegramWalletModalProps) {
  const [telegramUserId, setTelegramUserId] = useState("");
  const [network, setNetwork] = useState<string>("ARB-SEPOLIA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateWalletResult | null>(null);

  const networkOptions = useMemo(() => Object.keys(networks) as NetworkKey[], []);

  const resetState = () => {
    setTelegramUserId("");
    setNetwork("ARB-SEPOLIA");
    setError(null);
    setLoading(false);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!telegramUserId.trim()) {
      setError("Please enter a Telegram user ID or chat ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/telegram/create-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ telegramUserId: telegramUserId.trim(), network }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create Telegram wallet");
      }

      setResult(data as CreateWalletResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create Telegram wallet";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Telegram Wallet" showCloseButton>
      <div className="mt-6 flex w-full flex-col gap-4">
        {!result ? (
          <>
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              🤖 <strong>Create a Telegram wallet</strong>
              <br />
              Provide the Telegram user ID (or chat ID) to create or fetch a wallet for that user.
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Telegram User ID</label>
              <input
                type="text"
                value={telegramUserId}
                onChange={(event) => setTelegramUserId(event.target.value)}
                placeholder="123456789"
                className="rounded-lg border border-slate-300 px-4 py-3 text-base"
                disabled={loading}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !loading) {
                    handleSubmit();
                  }
                }}
              />
              <div className="text-xs text-slate-500">
                Find a user's ID via bot integrations or the Telegram app.
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Network</label>
              <select
                value={network}
                onChange={(event) => setNetwork(event.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-3 text-base"
                disabled={loading}
              >
                {networkOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500">
                Ensure your Telegram bot is configured for the selected network.
              </div>
            </div>

            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <PrimaryButton onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating Wallet..." : "Create Telegram Wallet"}
            </PrimaryButton>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <div className="mb-2 text-xl font-bold text-slate-900">
                {result.existingWallet ? "Wallet Found" : "Wallet Created"} 🎉
              </div>
              <div className="text-sm text-slate-600">
                Network: <strong>{result.network}</strong>
              </div>
            </div>

            <div className="w-full rounded-lg bg-slate-50 p-4 text-left">
              <div className="mb-1 text-xs font-medium text-slate-500">Wallet ID</div>
              <div className="mb-3 break-all font-mono text-xs text-slate-900">{result.walletId}</div>
              <div className="mb-1 text-xs font-medium text-slate-500">Wallet Address</div>
              <div className="break-all font-mono text-xs text-slate-900">{result.address}</div>
            </div>

            <PrimaryButton onClick={handleClose}>Done</PrimaryButton>
          </div>
        )}
      </div>
    </Modal>
  );
}
