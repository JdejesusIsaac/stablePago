import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/delegation/save
 * Save delegation metadata to Supabase
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      bot_address,
      daily_limit,
      weekly_limit,
      per_item_limit,
      approval_threshold,
      allowed_categories,
      valid_until,
      delegation_id,
    } = body;

    if (!user_id || !bot_address) {
      return NextResponse.json(
        { error: 'user_id and bot_address required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('crossmint_user_id', user_id)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Deactivate any existing active delegations for this bot
    await supabase
      .from('delegations')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Create new delegation record
    const { data: delegation, error } = await supabase
      .from('delegations')
      .insert({
        user_id: user.id,
        bot_address,
        daily_limit,
        weekly_limit,
        per_item_limit,
        approval_threshold,
        allowed_categories,
        valid_until,
        delegation_id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to save delegation: ${error.message}` },
        { status: 500 }
      );
    }

    // Create/update spend policy
    await supabase
      .from('spend_policies')
      .upsert({
        user_id: user.id,
        per_item_cap_usd: per_item_limit,
        daily_cap_usd: daily_limit,
        weekly_cap_usd: weekly_limit,
        approval_over_usd: approval_threshold,
        category_whitelist: allowed_categories,
        merchant_whitelist: allowed_categories, // Same for now
        is_paused: false,
      }, {
        onConflict: 'user_id'
      });

    return NextResponse.json({
      success: true,
      delegation,
    });
  } catch (error: any) {
    console.error('Error saving delegation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

