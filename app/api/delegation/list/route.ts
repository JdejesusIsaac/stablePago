import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/delegation/list?user_id=xxx
 * List all delegations for a user
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user from Crossmint ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('crossmint_user_id', user_id)
      .single();

    if (!user) {
      return NextResponse.json({
        delegations: [],
      });
    }

    // Get all delegations for this user
    const { data: delegations, error } = await supabase
      .from('delegations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch delegations: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      delegations: delegations || [],
    });
  } catch (error: any) {
    console.error('Error listing delegations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


