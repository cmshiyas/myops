import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { action, email, password, name } = await req.json();

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ user: data.user, session: data.session });
    }

    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return Response.json({ error: error.message }, { status: 401 });
      return Response.json({ user: data.user, session: data.session });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Auth error:', err);
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
