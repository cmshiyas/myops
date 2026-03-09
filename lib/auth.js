import { createClient } from '@supabase/supabase-js';

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Returns { userId, error } — never trusts a userId from the request body/params.
 *
 * Usage in any API route:
 *   const { userId, error } = await verifyAuth(req);
 *   if (error) return error; // already a Response object
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      userId: null,
      error: Response.json({ error: 'Missing or invalid Authorization header' }, { status: 401 }),
    };
  }

  const token = authHeader.slice(7); // strip "Bearer "

  // Use a per-request anon client to verify the JWT against Supabase
  // getUser() validates the token signature server-side — cannot be faked
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return {
      userId: null,
      error: Response.json({ error: 'Invalid or expired session. Please log in again.' }, { status: 401 }),
    };
  }

  return { userId: data.user.id, error: null };
}
