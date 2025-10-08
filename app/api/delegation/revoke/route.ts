import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/delegation/revoke
 * Revoke a delegation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { delegation_id } = body;

    if (!delegation_id) {
      return NextResponse.json(
        { error: 'delegation_id required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Mark delegation as inactive
    const { error } = await supabase
      .from('delegations')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', delegation_id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to revoke delegation: ${error.message}` },
        { status: 500 }
      );
    }

    // Also pause the spend policy
    const { data: delegation } = await supabase
      .from('delegations')
      .select('user_id')
      .eq('id', delegation_id)
      .single();

    if (delegation) {
      await supabase
        .from('spend_policies')
        .update({ is_paused: true })
        .eq('user_id', delegation.user_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Delegation revoked',
    });
  } catch (error: any) {
    console.error('Error revoking delegation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

