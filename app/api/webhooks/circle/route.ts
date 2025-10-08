import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Verify Circle webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Handle Circle webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.CIRCLE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('CIRCLE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Get raw body for signature verification
    const payload = await req.text();
    const signature = req.headers.get('circle-signature') || '';

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse event
    const event = JSON.parse(payload);
    const supabase = await createClient();

    // Store webhook event
    await supabase.from('webhook_events').insert({
      provider: 'circle',
      event_type: event.type,
      event_id: event.id,
      payload: event,
      signature,
      processed: false,
    });

    // Process based on event type
    switch (event.type) {
      case 'payouts.completed':
        await handlePayoutCompleted(event.data, supabase);
        break;

      case 'payouts.failed':
        await handlePayoutFailed(event.data, supabase);
        break;

      case 'payouts.processing':
        await handlePayoutProcessing(event.data, supabase);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', event.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle payout completed event
 */
async function handlePayoutCompleted(data: any, supabase: any) {
  const payoutId = data.id;

  await supabase
    .from('fiat_payouts')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
    })
    .eq('circle_payout_id', payoutId);

  console.log('Payout completed:', payoutId);
}

/**
 * Handle payout failed event
 */
async function handlePayoutFailed(data: any, supabase: any) {
  const payoutId = data.id;

  await supabase
    .from('fiat_payouts')
    .update({
      status: 'failed',
      error_code: data.errorCode,
      error_message: data.errorMessage || 'Payout failed',
      updated_at: new Date().toISOString(),
    })
    .eq('circle_payout_id', payoutId);

  console.log('Payout failed:', payoutId, data.errorCode);
}

/**
 * Handle payout processing event
 */
async function handlePayoutProcessing(data: any, supabase: any) {
  const payoutId = data.id;

  await supabase
    .from('fiat_payouts')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('circle_payout_id', payoutId);

  console.log('Payout processing:', payoutId);
}

