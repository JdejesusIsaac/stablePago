"use server";

import { createAdminClient } from '@/lib/supabase/admin';
import { circleRequest, type CircleBankWire, type CirclePayout, type CircleIdentity } from '@/utils/circle';
import { calculateWithdrawalFee, validateWithdrawalAmount } from '@/lib/fees';
import { randomUUID } from 'crypto';

/**
 * Create a bank beneficiary in Circle and store in Supabase
 */
export async function createCircleBankBeneficiary(input: {
  userId: string;
  legalName: string;
  bankName: string;
  country: string;
  billingDetails: CircleBankWire['billingDetails'];
  bankAddress: CircleBankWire['bankAddress'];
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
}) {
  try {
    const supabase = createAdminClient();

    // Check if user exists, create if not
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('crossmint_user_id', input.userId)
      .single();

    let dbUserId = existingUser?.id;

    if (!existingUser) {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          crossmint_user_id: input.userId,
        })
        .select('id')
        .single();

      if (userError) throw new Error(`Failed to create user: ${userError.message}`);
      dbUserId = newUser.id;
    }

    // Generate idempotency key
    const idempotencyKey = `beneficiary-${input.userId}-${Date.now()}`;

    // Create beneficiary in Circle
    const circleResponse = await circleRequest('/v1/businessAccount/banks/wires', {
      method: 'POST',
      idempotencyKey,
      body: {
        billingDetails: input.billingDetails,
        bankAddress: input.bankAddress,
        accountNumber: input.accountNumber,
        routingNumber: input.routingNumber,
        iban: input.iban,
      },
    });

    const destinationId = circleResponse.data.id;

    // Store in Supabase
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from('bank_beneficiaries')
      .insert({
        user_id: dbUserId,
        circle_destination_id: destinationId,
        legal_name: input.legalName,
        bank_name: input.bankName,
        country: input.country,
        account_last_four: input.accountNumber.slice(-4),
        status: 'active',
      })
      .select()
      .single();

    if (beneficiaryError) throw new Error(`Failed to store beneficiary: ${beneficiaryError.message}`);

    return {
      success: true,
      data: {
        beneficiaryId: beneficiary.id,
        destinationId,
      },
    };
  } catch (error: any) {
    console.error('Error creating bank beneficiary:', error);
    return {
      success: false,
      error: error.message || 'Failed to create bank beneficiary',
    };
  }
}

/**
 * Create a Circle payout (withdrawal)
 */
export async function createCirclePayout(input: {
  userId: string;
  beneficiaryId: string;
  amountUsd: number;
  walletId: string;
  originatorIdentity?: CircleIdentity;
}) {
  try {
    const supabase = createAdminClient();

    // Get user's database ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('crossmint_user_id', input.userId)
      .single();

    if (!user) throw new Error('User not found');

    // Get beneficiary
    const { data: beneficiary } = await supabase
      .from('bank_beneficiaries')
      .select('circle_destination_id')
      .eq('id', input.beneficiaryId)
      .eq('user_id', user.id)
      .single();

    if (!beneficiary) throw new Error('Bank beneficiary not found');

    // Calculate fees
    const feeCalc = calculateWithdrawalFee(input.amountUsd);

    // Validate amount
    const validation = validateWithdrawalAmount(input.amountUsd, input.amountUsd);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate idempotency key
    const idempotencyKey = `payout-${input.userId}-${Date.now()}-${randomUUID()}`;

    // Prepare Circle payout request
    const payoutBody: CirclePayout & { idempotencyKey: string } = {
      idempotencyKey,
      destination: {
        type: 'wire',
        id: beneficiary.circle_destination_id,
      },
      amount: {
        currency: 'USD',
        amount: feeCalc.netAmount.toFixed(2),
      },
    };

    // Add source with identity if required (Travel Rule >= $3,000)
    if (input.originatorIdentity) {
      payoutBody.source = {
        type: 'wallet',
        id: input.walletId,
        identities: [input.originatorIdentity],
      };
    } else {
      payoutBody.source = {
        type: 'wallet',
        id: input.walletId,
      };
    }

    // Create payout in Circle
    const circleResponse = await circleRequest('/v1/businessAccount/payouts', {
      method: 'POST',
      idempotencyKey,
      body: payoutBody,
    });

    const payoutId = circleResponse.data.id;

    // Store in Supabase
    const { data: payout, error: payoutError } = await supabase
      .from('fiat_payouts')
      .insert({
        user_id: user.id,
        beneficiary_id: input.beneficiaryId,
        wallet_id: input.walletId,
        amount_usd: feeCalc.amount,
        fee_usd: feeCalc.fee,
        net_amount_usd: feeCalc.netAmount,
        provider: 'circle',
        circle_payout_id: payoutId,
        status: 'pending',
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (payoutError) throw new Error(`Failed to store payout: ${payoutError.message}`);

    return {
      success: true,
      data: {
        payoutId: payout.id,
        circlePayoutId: payoutId,
        amount: feeCalc.amount,
        fee: feeCalc.fee,
        netAmount: feeCalc.netAmount,
        status: 'pending',
      },
    };
  } catch (error: any) {
    console.error('Error creating payout:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payout',
    };
  }
}

/**
 * Get payout status from Circle and update Supabase
 */
export async function getCirclePayoutStatus(payoutId: string) {
  try {
    const supabase = createAdminClient();

    // Get payout from database
    const { data: payout } = await supabase
      .from('fiat_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (!payout) throw new Error('Payout not found');

    if (!payout.circle_payout_id) {
      return {
        success: true,
        data: {
          status: payout.status,
        },
      };
    }

    // Fetch status from Circle
    const circleResponse = await circleRequest(
      `/v1/businessAccount/payouts/${payout.circle_payout_id}`
    );

    const circleStatus = circleResponse.data.status;

    // Map Circle status to our status
    let status = 'pending';
    if (circleStatus === 'complete') status = 'succeeded';
    if (circleStatus === 'failed') status = 'failed';
    if (circleStatus === 'processing') status = 'processing';

    // Update in database
    await supabase
      .from('fiat_payouts')
      .update({
        status,
        error_code: circleResponse.data.errorCode,
        error_message: circleResponse.data.errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutId);

    return {
      success: true,
      data: {
        status,
        trackingRef: circleResponse.data.trackingRef,
        errorCode: circleResponse.data.errorCode,
        errorMessage: circleResponse.data.errorMessage,
      },
    };
  } catch (error: any) {
    console.error('Error fetching payout status:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payout status',
    };
  }
}

/**
 * Get user's bank beneficiaries
 */
export async function getUserBankBeneficiaries(userId: string) {
  try {
    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('crossmint_user_id', userId)
      .single();

    if (!user) return { success: true, data: [] };

    const { data: beneficiaries, error } = await supabase
      .from('bank_beneficiaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: beneficiaries || [],
    };
  } catch (error: any) {
    console.error('Error fetching beneficiaries:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch beneficiaries',
    };
  }
}

/**
 * Get user's payout history
 */
export async function getUserPayouts(userId: string) {
  try {
    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('crossmint_user_id', userId)
      .single();

    if (!user) return { success: true, data: [] };

    const { data: payouts, error } = await supabase
      .from('fiat_payouts')
      .select('*, bank_beneficiaries(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return {
      success: true,
      data: payouts || [],
    };
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payouts',
    };
  }
}

