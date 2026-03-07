import { createClient } from '@supabase/supabase-js';

const MONTHLY_TOKEN_LIMIT = parseInt(process.env.TOKEN_LIMIT_PER_MONTH || '50000', 10);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

    const supabase = getSupabase();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('token_usage')
      .select('tokens_used, month, last_used_at')
      .eq('user_id', userId)
      .eq('month', monthKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const tokensUsed = data?.tokens_used || 0;
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return Response.json({
      tokensUsed,
      tokenLimit: MONTHLY_TOKEN_LIMIT,
      tokensRemaining: Math.max(0, MONTHLY_TOKEN_LIMIT - tokensUsed),
      percentUsed: Math.min(100, Math.round((tokensUsed / MONTHLY_TOKEN_LIMIT) * 100)),
      month: monthKey,
      resetDate,
      lastUsedAt: data?.last_used_at || null,
    });
  } catch (err) {
    console.error('Usage route error:', err);
    return Response.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
