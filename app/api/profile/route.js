import { createClient } from '@supabase/supabase-js';

// Reuse Supabase client across requests in the same function instance
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

    // Fetch profile + opportunities in a single parallel call to Supabase
    const supabase = getSupabase();
    const [profileResult, opsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('opportunities').select('opportunities').eq('user_id', userId).single(),
    ]);

    const profile = (profileResult.error?.code === 'PGRST116') ? null : profileResult.data;
    const opportunities = (opsResult.error?.code === 'PGRST116') ? [] : (opsResult.data?.opportunities || []);

    return Response.json({ profile: profile || null, opportunities });
  } catch (err) {
    return Response.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
