"use client";

import React, { useState } from "react";
import { PrimaryButton } from "../common/PrimaryButton";

interface BankFormProps {
  onSubmit: (bankDetails: BankDetails) => Promise<void>;
  isLoading: boolean;
}

export interface BankDetails {
  legalName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  country: string;
  address: {
    line1: string;
    city: string;
    district: string;
    postalCode: string;
  };
}

const PR_BANKS = [
  "Banco Popular de Puerto Rico",
  "FirstBank Puerto Rico",
  "Banco Santander Puerto Rico",
  "Oriental Bank",
  "Scotiabank de Puerto Rico",
];

const DR_BANKS = [
  "Banco Popular Dominicano",
  "Banco BHD León",
  "Banco de Reservas",
  "Banco Santa Cruz",
  "Banesco",
];

export function BankForm({ onSubmit, isLoading }: BankFormProps) {
  const [country, setCountry] = useState<"PR" | "DR">("PR");
  const [legalName, setLegalName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [address, setAddress] = useState({
    line1: "",
    city: "",
    district: "",
    postalCode: "",
  });

  const banks = country === "PR" ? PR_BANKS : DR_BANKS;

  const isValid =
    legalName.trim() !== "" &&
    bankName.trim() !== "" &&
    accountNumber.trim() !== "" &&
    routingNumber.trim() !== "" &&
    address.line1.trim() !== "" &&
    address.city.trim() !== "" &&
    address.district.trim() !== "" &&
    address.postalCode.trim() !== "";

  const handleSubmit = async () => {
    if (!isValid) return;

    await onSubmit({
      legalName,
      bankName,
      accountNumber,
      routingNumber,
      country,
      address,
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        ℹ️ Add your bank account to receive withdrawals. This is a one-time setup.
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Country</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value as "PR" | "DR")}
          className="rounded-lg border border-slate-300 px-4 py-2"
          disabled={isLoading}
        >
          <option value="PR">🇵🇷 Puerto Rico</option>
          <option value="DR">🇩🇴 Dominican Republic</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Full Legal Name</label>
        <input
          type="text"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="Juan Pérez"
          className="rounded-lg border border-slate-300 px-4 py-2"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Bank</label>
        <select
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2"
          disabled={isLoading}
        >
          <option value="">Select bank...</option>
          {banks.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Account Number</label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          placeholder="123456789"
          className="rounded-lg border border-slate-300 px-4 py-2"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          Routing Number {country === "PR" && "(ABA)"}
        </label>
        <input
          type="text"
          value={routingNumber}
          onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ""))}
          placeholder="021000021"
          className="rounded-lg border border-slate-300 px-4 py-2"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Address Line 1</label>
        <input
          type="text"
          value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
          placeholder="123 Main Street"
          className="rounded-lg border border-slate-300 px-4 py-2"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">City</label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            placeholder="San Juan"
            className="rounded-lg border border-slate-300 px-4 py-2"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">State/Province</label>
          <input
            type="text"
            value={address.district}
            onChange={(e) => setAddress({ ...address, district: e.target.value })}
            placeholder={country === "PR" ? "PR" : "Distrito Nacional"}
            className="rounded-lg border border-slate-300 px-4 py-2"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Postal Code</label>
        <input
          type="text"
          value={address.postalCode}
          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
          placeholder="00901"
          className="rounded-lg border border-slate-300 px-4 py-2"
          disabled={isLoading}
        />
      </div>

      <PrimaryButton disabled={!isValid || isLoading} onClick={handleSubmit}>
        {isLoading ? "Adding Bank..." : "Add Bank Account"}
      </PrimaryButton>
    </div>
  );
}

