import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function POST(req) {
  const { userId, error: authError } = await verifyAuth(req);
  if (authError) return authError;

  try {
    const { data: profile } = await getSupabase()
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return Response.json({ error: 'No billing account found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) return Response.json({ error: 'App URL not configured' }, { status: 500 });

    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: `${appUrl}/?stripe=portal`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
