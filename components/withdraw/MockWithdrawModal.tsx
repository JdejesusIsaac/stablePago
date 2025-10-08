"use client";

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { PrimaryButton } from "../common/PrimaryButton";
import { useBalance } from "@/hooks/useBalance";

interface MockWithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

export function MockWithdrawModal({ open, onClose }: MockWithdrawModalProps) {
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const { displayableBalance } = useBalance();

  const isValid =
    Number(amount) > 0 &&
    Number(amount) <= Number(displayableBalance) &&
    bankName.trim() !== "" &&
    accountNumber.trim() !== "" &&
    routingNumber.trim() !== "";

  const handleWithdraw = async () => {
    setStep("processing");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock success
    setStep("success");
  };

  const handleClose = () => {
    setStep("form");
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setRoutingNumber("");
    onClose();
  };

  const fee = Number(amount) * 0.0125; // 1.25% fee
  const netAmount = Number(amount) - fee;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      showBackButton={step === "form"}
      onBack={handleClose}
      title="Withdraw to Bank (Mock)"
    >
      {step === "form" && (
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            ⚠️ This is a MOCK withdrawal for testing. Circle API not connected yet.
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="rounded-lg border border-slate-300 px-4 py-2 text-lg"
            />
            <div className="text-sm text-slate-500">
              Available: ${displayableBalance}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Banco Popular"
              className="rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="12345678"
              className="rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Routing Number</label>
            <input
              type="text"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              placeholder="021000021"
              className="rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>

          {Number(amount) > 0 && (
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Amount</span>
                <span className="font-medium">${Number(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Fee (1.25%)</span>
                <span className="font-medium text-red-600">-${fee.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">You'll receive</span>
                <span className="font-bold text-emerald-600">${netAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <PrimaryButton disabled={!isValid} onClick={handleWithdraw}>
            Withdraw to Bank
          </PrimaryButton>
        </div>
      )}

      {step === "processing" && (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">Processing withdrawal...</div>
            <div className="text-sm text-slate-500">
              This usually takes 1-2 business days
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
            <div className="mb-2 text-xl font-bold text-slate-900">Withdrawal Initiated!</div>
            <div className="mb-1 text-sm text-slate-600">
              ${netAmount.toFixed(2)} will be sent to:
            </div>
            <div className="text-sm font-medium text-slate-900">{bankName}</div>
            <div className="text-sm text-slate-500">****{accountNumber.slice(-4)}</div>
            <div className="mt-4 text-xs text-slate-500">
              (This is a mock transaction - no real withdrawal occurred)
            </div>
          </div>
          <PrimaryButton onClick={handleClose}>Done</PrimaryButton>
        </div>
      )}
    </Modal>
  );
}


