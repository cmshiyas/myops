import { createClient } from '@supabase/supabase-js';

// Server-side routes must use the service role key to bypass RLS.
// The anon key respects RLS and has no user JWT attached here, so writes fail.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function POST(req) {
  try {
    const { userId, profile } = await req.json();
    if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    const supabase = getSupabase();
    const { error } = await supabase
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ profile: data || null });
  } catch (err) {
    return Response.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
