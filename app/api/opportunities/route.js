import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// GET — load saved opportunities for a user
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('opportunities')
      .select('opportunities, generated_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({
      opportunities: data?.opportunities || [],
      generatedAt: data?.generated_at || null,
    });
  } catch (err) {
    console.error('Opportunities GET error:', err);
    return Response.json({ error: 'Failed to load opportunities' }, { status: 500 });
  }
}

// POST — save opportunities for a user (upsert)
export async function POST(req) {
  try {
    const { userId, opportunities } = await req.json();
    if (!userId || !opportunities) {
      return Response.json({ error: 'userId and opportunities required' }, { status: 400 });
    }
    const supabase = getSupabase();
    const { error } = await supabase
      .from('opportunities')
      .upsert({
        user_id: userId,
        opportunities,
        generated_at: new Date().toISOString(),
      });

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ success: true });
  } catch (err) {
    console.error('Opportunities POST error:', err);
    return Response.json({ error: 'Failed to save opportunities' }, { status: 500 });
  }
}
