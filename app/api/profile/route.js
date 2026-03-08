import { createClient } from '@supabase/supabase-js';

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

const PLAN_TOKEN_LIMITS = { silver: 1000, gold: 5000, platinum: 15000 };

function calcUsageStats(tokensUsed, plan) {
  const tokenLimit = PLAN_TOKEN_LIMITS[plan] || 0;
  const percentUsed = tokenLimit > 0 ? Math.min(100, Math.round((tokensUsed / tokenLimit) * 100)) : 0;
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetDate = nextMonth.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return { tokensUsed, tokenLimit, percentUsed, resetDate };
}

export async function POST(req) {
  try {
    const { userId, profile } = await req.json();
    if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const { error } = await getSupabase()
      .from('profiles')
      .upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const supabase = getSupabase();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch profile, opportunities AND token usage in one parallel round-trip
    const [profileResult, opsResult, usageResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('opportunities').select('opportunities').eq('user_id', userId).single(),
      supabase.from('token_usage').select('tokens_used').eq('user_id', userId).eq('month', monthKey).single(),
    ]);

    const profile      = (profileResult.error?.code === 'PGRST116') ? null : profileResult.data;
    const opportunities = (opsResult.error?.code === 'PGRST116') ? [] : (opsResult.data?.opportunities || []);
    const tokensUsed   = (usageResult.error?.code === 'PGRST116') ? 0 : (usageResult.data?.tokens_used || 0);
    const plan         = profile?.plan || 'silver';
    const usage        = calcUsageStats(tokensUsed, plan);

    return Response.json({ profile: profile || null, opportunities, usage });
  } catch (err) {
    return Response.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
