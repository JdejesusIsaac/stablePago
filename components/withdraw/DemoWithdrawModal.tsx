"use client";

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { PrimaryButton } from "../common/PrimaryButton";
import { BankForm, type BankDetails } from "./BankForm";
import { useBalance } from "@/hooks/useBalance";

interface DemoWithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "select_bank" | "add_bank" | "enter_amount" | "confirm" | "processing" | "success";

export function DemoWithdrawModal({ open, onClose }: DemoWithdrawModalProps) {
  const [step, setStep] = useState<Step>("select_bank");
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { displayableBalance } = useBalance();

  const handleAddBank = async (bankDetails: BankDetails) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock bank saved
    const newBank = {
      id: Date.now().toString(),
      bank_name: bankDetails.bankName,
      legal_name: bankDetails.legalName,
      account_last_four: bankDetails.accountNumber.slice(-4),
      country: bankDetails.country,
    };

    setBanks([...banks, newBank]);
    setIsLoading(false);
    setStep("select_bank");
  };

  const handleSelectBank = (bank: any) => {
    setSelectedBank(bank);
    setStep("enter_amount");
  };

  const handleContinue = () => {
    if (!amount || Number(amount) <= 0 || Number(amount) > Number(displayableBalance)) {
      return;
    }
    setStep("confirm");
  };

  const handleConfirmWithdraw = async () => {
    setIsLoading(true);
    setStep("processing");

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);
    setStep("success");
  };

  const handleClose = () => {
    setStep("select_bank");
    setAmount("");
    setSelectedBank(null);
    onClose();
  };

  const handleBack = () => {
    if (step === "enter_amount") setStep("select_bank");
    else if (step === "confirm") setStep("enter_amount");
    else handleClose();
  };

  const fee = Number(amount) * 0.0125; // 1.25%
  const minFee = 1.0;
  const actualFee = Math.max(fee, minFee);
  const netAmount = Number(amount) - actualFee;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      showBackButton={!["processing", "success"].includes(step)}
      onBack={handleBack}
      title={step === "add_bank" ? "Add Bank Account (Demo)" : "Withdraw to Bank (Demo)"}
    >
      <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
        🎭 <strong>Demo Mode:</strong> Circle API not configured. Testing UI only.
      </div>

      {step === "add_bank" && (
        <BankForm onSubmit={handleAddBank} isLoading={isLoading} />
      )}

      {step === "select_bank" && (
        <div className="flex w-full flex-col gap-4">
          {banks.length === 0 ? (
            <>
              <div className="text-center text-slate-600">
                No bank accounts yet. Add one to get started.
              </div>
              <PrimaryButton onClick={() => setStep("add_bank")}>
                Add Bank Account
              </PrimaryButton>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-600">Select a bank account:</div>
              {banks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => handleSelectBank(bank)}
                  className="rounded-lg border border-slate-300 p-4 text-left transition hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <div className="font-semibold text-slate-900">{bank.bank_name}</div>
                  <div className="text-sm text-slate-600">
                    ****{bank.account_last_four} • {bank.legal_name}
                  </div>
                </button>
              ))}
              <button
                onClick={() => setStep("add_bank")}
                className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
              >
                + Add New Bank Account
              </button>
            </>
          )}
        </div>
      )}

      {step === "enter_amount" && (
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Withdraw Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="5"
              step="0.01"
              className="rounded-lg border border-slate-300 px-4 py-2 text-2xl"
            />
            <div className="text-sm text-slate-500">
              Available: ${displayableBalance}
            </div>
          </div>

          {Number(amount) > 0 && (
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Amount</span>
                <span className="font-medium">${Number(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Fee (1.25%)</span>
                <span className="font-medium text-red-600">-${actualFee.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">You'll receive</span>
                <span className="font-bold text-emerald-600">${netAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <PrimaryButton
            disabled={!amount || Number(amount) <= 0 || Number(amount) > Number(displayableBalance)}
            onClick={handleContinue}
          >
            Continue
          </PrimaryButton>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="mb-2 font-semibold text-blue-900">Confirm Withdrawal</div>
            <div className="text-sm text-blue-800">
              ${netAmount.toFixed(2)} will be sent to:
            </div>
            <div className="mt-2 font-medium text-blue-900">{selectedBank?.bank_name}</div>
            <div className="text-sm text-blue-700">****{selectedBank?.account_last_four}</div>
          </div>

          <div className="text-sm text-slate-600">
            Processing time: 1-2 business days
          </div>

          <PrimaryButton onClick={handleConfirmWithdraw} disabled={isLoading}>
            Confirm Withdrawal
          </PrimaryButton>
        </div>
      )}

      {step === "processing" && (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">Processing withdrawal...</div>
            <div className="text-sm text-slate-500">Simulating API call...</div>
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
            <div className="mb-2 text-xl font-bold text-slate-900">Withdrawal Initiated! 🎉</div>
            <div className="mb-1 text-sm text-slate-600">
              This is a demo - no real transaction occurred
            </div>
            <div className="text-sm text-slate-500">
              In production, $${netAmount.toFixed(2)} would be sent to your bank
            </div>
          </div>
          <PrimaryButton onClick={handleClose}>Done</PrimaryButton>
        </div>
      )}
    </Modal>
  );
}

