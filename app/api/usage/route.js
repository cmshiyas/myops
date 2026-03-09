import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth';

const PLAN_TOKEN_LIMITS = { silver: 1000, gold: 5000, platinum: 15000 };

let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _supabase;
}

export async function GET(req) {
  const { userId, error: authError } = await verifyAuth(req);
  if (authError) return authError;

  try {
    const supabase = getSupabase();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [profileResult, usageResult] = await Promise.all([
      supabase.from('profiles').select('plan').eq('user_id', userId).single(),
      supabase.from('token_usage').select('tokens_used, last_used_at').eq('user_id', userId).eq('month', monthKey).single(),
    ]);

    const plan       = profileResult.data?.plan || 'silver';
    const tokenLimit = PLAN_TOKEN_LIMITS[plan] ?? 1000;
    const tokensUsed = (usageResult.error?.code === 'PGRST116') ? 0 : (usageResult.data?.tokens_used || 0);
    const resetDate  = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                        .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return Response.json({
      tokensUsed,
      tokenLimit,
      tokensRemaining: Math.max(0, tokenLimit - tokensUsed),
      percentUsed:     Math.min(100, Math.round((tokensUsed / tokenLimit) * 100)),
      month:           monthKey,
      resetDate,
      plan,
      lastUsedAt:      usageResult.data?.last_used_at || null,
    });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
