import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// CRITICAL: Tell Next.js not to parse the body — Stripe needs the raw bytes
// to verify the webhook signature. If the body is parsed first, signature
// verification always fails with a 400.
export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Map Stripe price IDs back to plan names
function getPlanFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_PRICE_GOLD)     return 'gold';
  if (priceId === process.env.STRIPE_PRICE_PLATINUM) return 'platinum';
  return 'silver';
}

async function updateUserPlan(supabaseUserId, plan) {
  const supabase = getSupabase();
  await supabase
    .from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('user_id', supabaseUserId);
  console.log(`Updated user ${supabaseUserId} to plan: ${plan}`);
}

export async function POST(req) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  console.log('Webhook received. Event signature present:', !!sig);
  console.log('Body length:', body.length);
  console.log('STRIPE_WEBHOOK_SECRET set:', !!process.env.STRIPE_WEBHOOK_SECRET);

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('Webhook event type:', event.type);

  try {
    switch (event.type) {

      // Payment succeeded → activate plan
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.metadata?.supabase_user_id;
        const plan    = session.metadata?.plan;
        console.log('checkout.session.completed — userId:', userId, 'plan:', plan);
        if (userId && plan) await updateUserPlan(userId, plan);
        else console.warn('Missing userId or plan in session metadata:', session.metadata);
        break;
      }

      // Subscription updated (e.g. plan change, or user hits "cancel at period end")
      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        if (sub.status === 'active') {
          // User may have switched plans mid-cycle — update to new plan immediately
          const plan = getPlanFromPriceId(sub.items.data[0].price.id);
          await updateUserPlan(userId, plan);
        }
        // If cancel_at_period_end is true, the subscription is still active until
        // the period ends — do NOT downgrade yet. Downgrade fires on .deleted below.
        break;
      }

      // Subscription fully ended (period expired after cancellation, or immediate cancel)
      // This is the correct place to downgrade — Stripe only fires this once access
      // should actually be revoked, respecting the billing period.
      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) await updateUserPlan(userId, 'silver');
        break;
      }

      // Payment failed — optionally notify or downgrade
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const userId = customer.metadata?.supabase_user_id;
        if (userId) {
          console.warn(`Payment failed for user ${userId}`);
          // Stripe will retry — only downgrade after subscription.deleted fires
        }
        break;
      }

      default:
        // Ignore other event types
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response('Handler error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
