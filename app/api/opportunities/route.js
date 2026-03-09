export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../../../lib/auth';

const MAX_OPPORTUNITIES = 50; // sanity cap on payload size

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function GET(req) {
  const { userId, error: authError } = await verifyAuth(req);
  if (authError) return authError;

  try {
    const { data, error } = await getSupabase()
      .from('opportunities')
      .select('opportunities, generated_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({
      opportunities: data?.opportunities || [],
      generatedAt:   data?.generated_at || null,
    });
  } catch (err) {
    return Response.json({ error: 'Failed to load opportunities' }, { status: 500 });
  }
}

export async function POST(req) {
  const { userId, error: authError } = await verifyAuth(req);
  if (authError) return authError;

  try {
    const { opportunities } = await req.json();

    if (!Array.isArray(opportunities)) {
      return Response.json({ error: 'opportunities must be an array' }, { status: 400 });
    }
    if (opportunities.length > MAX_OPPORTUNITIES) {
      return Response.json({ error: `Too many opportunities (max ${MAX_OPPORTUNITIES})` }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from('opportunities')
      .upsert({
        user_id:      userId,
        opportunities,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Failed to save opportunities' }, { status: 500 });
  }
}
