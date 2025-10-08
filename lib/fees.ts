/**
 * Fee Calculation Logic for StablePago
 */

export interface FeeConfig {
  feeBps: number; // Fee in basis points (125 = 1.25%)
  minFeeUsd: number;
  maxFeeUsd?: number;
}

export interface FeeCalculation {
  amount: number;
  fee: number;
  netAmount: number;
  feePercentage: number;
}

/**
 * Calculate withdrawal fee
 * Default: 1.25% with $1.00 minimum
 */
export function calculateWithdrawalFee(
  amountUsd: number,
  config: FeeConfig = { feeBps: 125, minFeeUsd: 1.00 }
): FeeCalculation {
  const feePercentage = config.feeBps / 10000; // Convert basis points to decimal
  let fee = amountUsd * feePercentage;

  // Apply minimum fee
  if (fee < config.minFeeUsd) {
    fee = config.minFeeUsd;
  }

  // Apply maximum fee if configured
  if (config.maxFeeUsd && fee > config.maxFeeUsd) {
    fee = config.maxFeeUsd;
  }

  const netAmount = amountUsd - fee;

  return {
    amount: Number(amountUsd.toFixed(2)),
    fee: Number(fee.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2)),
    feePercentage: feePercentage * 100,
  };
}

/**
 * Check if amount meets minimum withdrawal threshold
 */
export function meetsMinimumWithdrawal(amountUsd: number): boolean {
  const MIN_WITHDRAWAL = 5.00; // $5 minimum
  return amountUsd >= MIN_WITHDRAWAL;
}

/**
 * Check if withdrawal requires Travel Rule identity
 * Circle requires identity for payouts >= $3,000
 */
export function requiresTravelRuleIdentity(amountUsd: number): boolean {
  const TRAVEL_RULE_THRESHOLD = 3000.00;
  return amountUsd >= TRAVEL_RULE_THRESHOLD;
}

/**
 * Validate withdrawal amount
 */
export interface WithdrawalValidation {
  isValid: boolean;
  error?: string;
}

export function validateWithdrawalAmount(
  amountUsd: number,
  availableBalance: number
): WithdrawalValidation {
  if (amountUsd <= 0) {
    return { isValid: false, error: 'Amount must be greater than $0' };
  }

  if (!meetsMinimumWithdrawal(amountUsd)) {
    return { isValid: false, error: 'Minimum withdrawal is $5.00' };
  }

  if (amountUsd > availableBalance) {
    return { isValid: false, error: 'Insufficient balance' };
  }

  const { netAmount } = calculateWithdrawalFee(amountUsd);
  if (netAmount <= 0) {
    return { isValid: false, error: 'Amount too small after fees' };
  }

  return { isValid: true };
}

/**
 * Format USD amount for display
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

