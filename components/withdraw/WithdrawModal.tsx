"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { PrimaryButton } from "../common/PrimaryButton";
import { BankForm, type BankDetails } from "./BankForm";
import { useBalance } from "@/hooks/useBalance";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import {
  createCircleBankBeneficiary,
  createCirclePayout,
  getUserBankBeneficiaries,
  getCirclePayoutStatus,
} from "@/server-actions/fiat/circle-actions";
import { calculateWithdrawalFee, formatUSD, requiresTravelRuleIdentity } from "@/lib/fees";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "select_bank" | "add_bank" | "enter_amount" | "confirm" | "processing" | "success" | "error";

export function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const [step, setStep] = useState<Step>("select_bank");
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payoutId, setPayoutId] = useState<string | null>(null);

  const { displayableBalance, refetch: refetchBalance } = useBalance();
  const { user } = useAuth();
  const { wallet } = useWallet();

  // Load user's banks
  useEffect(() => {
    if (open && user?.id) {
      loadBanks();
    }
  }, [open, user?.id]);

  const loadBanks = async () => {
    if (!user?.id) return;

    const result = await getUserBankBeneficiaries(user.id);
    if (result.success) {
      setBanks(result.data || []);
      if (result.data && result.data.length > 0) {
        setStep("select_bank");
      } else {
        setStep("add_bank");
      }
    }
  };

  const handleAddBank = async (bankDetails: BankDetails) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createCircleBankBeneficiary({
        userId: user.id,
        legalName: bankDetails.legalName,
        bankName: bankDetails.bankName,
        country: bankDetails.country,
        billingDetails: {
          name: bankDetails.legalName,
          city: bankDetails.address.city,
          country: bankDetails.country,
          line1: bankDetails.address.line1,
          district: bankDetails.address.district,
          postalCode: bankDetails.address.postalCode,
        },
        bankAddress: {
          bankName: bankDetails.bankName,
          city: bankDetails.address.city,
          country: bankDetails.country,
          line1: bankDetails.address.line1,
          district: bankDetails.address.district,
        },
        accountNumber: bankDetails.accountNumber,
        routingNumber: bankDetails.routingNumber,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to add bank");
      }

      // Reload banks and move to selection
      await loadBanks();
      setStep("select_bank");
    } catch (err: any) {
      setError(err.message || "Failed to add bank account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBank = (bank: any) => {
    setSelectedBank(bank);
    setStep("enter_amount");
  };

  const handleContinue = () => {
    if (!amount || Number(amount) <= 0 || Number(amount) > Number(displayableBalance)) {
      setError("Invalid amount");
      return;
    }

    setError(null);
    setStep("confirm");
  };

  const handleConfirmWithdraw = async () => {
    if (!user?.id || !wallet || !selectedBank) return;

    setIsLoading(true);
    setError(null);
    setStep("processing");

    try {
      const amountNum = Number(amount);

      // Check if Travel Rule identity is required
      if (requiresTravelRuleIdentity(amountNum)) {
        throw new Error("Withdrawals ≥ $3,000 require identity verification. Please contact support.");
      }

      const result = await createCirclePayout({
        userId: user.id,
        beneficiaryId: selectedBank.id,
        amountUsd: amountNum,
        walletId: wallet.address,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create withdrawal");
      }

      setPayoutId(result.data.payoutId);
      setStep("success");
      refetchBalance();
    } catch (err: any) {
      setError(err.message || "Failed to process withdrawal");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("select_bank");
    setAmount("");
    setSelectedBank(null);
    setError(null);
    setPayoutId(null);
    onClose();
  };

  const handleBack = () => {
    if (step === "enter_amount") setStep("select_bank");
    else if (step === "confirm") setStep("enter_amount");
    else handleClose();
  };

  const feeCalc = amount ? calculateWithdrawalFee(Number(amount)) : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      showBackButton={!["processing", "success", "error"].includes(step)}
      onBack={handleBack}
      title={step === "add_bank" ? "Add Bank Account" : "Withdraw to Bank"}
    >
      {step === "add_bank" && (
        <BankForm onSubmit={handleAddBank} isLoading={isLoading} />
      )}

      {step === "select_bank" && (
        <div className="flex w-full flex-col gap-4">
          {banks.length === 0 ? (
            <>
              <div className="text-center text-slate-600">
                No bank accounts found. Add one to get started.
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

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          {feeCalc && (
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Amount</span>
                <span className="font-medium">{formatUSD(feeCalc.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Fee ({feeCalc.feePercentage}%)</span>
                <span className="font-medium text-red-600">-{formatUSD(feeCalc.fee)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">You'll receive</span>
                <span className="font-bold text-emerald-600">{formatUSD(feeCalc.netAmount)}</span>
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

      {step === "confirm" && feeCalc && (
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="mb-2 font-semibold text-blue-900">Confirm Withdrawal</div>
            <div className="text-sm text-blue-800">
              {formatUSD(feeCalc.netAmount)} will be sent to:
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
            <div className="text-sm text-slate-500">This may take a moment</div>
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
              Your withdrawal is being processed
            </div>
            <div className="text-sm text-slate-500">
              Funds will arrive in 1-2 business days
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
            <div className="mb-2 text-xl font-bold text-slate-900">Withdrawal Failed</div>
            {error && (
              <div className="mb-4 text-sm text-red-600">{error}</div>
            )}
          </div>
          <PrimaryButton onClick={() => setStep("enter_amount")}>Try Again</PrimaryButton>
        </div>
      )}
    </Modal>
  );
}

