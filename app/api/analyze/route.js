import { createClient } from '@supabase/supabase-js';

// Per-plan token limits — single source of truth on the server
const PLAN_TOKEN_LIMITS = {
  silver:   0,
  gold:     2000,
  platinum: 20000,
};

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase server env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserPlan(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('plan')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error('Could not verify user plan');
  return data?.plan || 'silver';
}

async function getUsageThisMonth(supabase, userId) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { data, error } = await supabase
    .from('token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .eq('month', monthKey)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return { tokens: data?.tokens_used || 0, monthKey };
}

async function recordUsage(supabase, userId, monthKey, newTokens) {
  await supabase.rpc('increment_token_usage', {
    p_user_id: userId,
    p_month:   monthKey,
    p_tokens:  newTokens,
  });
}

export async function POST(req) {
  try {
    const { profileSummary, userId } = await req.json();

    if (!profileSummary) {
      return Response.json({ error: 'No profile data provided' }, { status: 400 });
    }

    // ── GAP 1 FIX: userId is mandatory — no anonymous analysis ───────────────
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = getServerSupabase();

    // ── GAP 2 FIX: Fetch plan from DB — never trust client-supplied plan ─────
    let plan;
    try {
      plan = await getUserPlan(supabase, userId);
    } catch (e) {
      console.error('Plan fetch failed:', e.message);
      return Response.json({ error: 'Could not verify your plan. Please try again.' }, { status: 403 });
    }

    const tokenLimit = PLAN_TOKEN_LIMITS[plan] ?? 0;

    // ── GAP 3 FIX: Silver plan blocked server-side, not just in UI ───────────
    if (tokenLimit === 0) {
      return Response.json({
        error: 'limit_reached',
        message: 'Upgrade to Gold or Platinum to run AI analysis.',
        plan,
        tokenLimit: 0,
      }, { status: 403 });
    }

    // ── Check monthly usage against plan limit ───────────────────────────────
    let monthKey;
    let currentTokens;
    try {
      const usage = await getUsageThisMonth(supabase, userId);
      monthKey      = usage.monthKey;
      currentTokens = usage.tokens;
    } catch (e) {
      console.error('Usage fetch failed:', e.message);
      return Response.json({ error: 'Could not check token usage. Please try again.' }, { status: 500 });
    }

    if (currentTokens >= tokenLimit) {
      return Response.json({
        error: 'limit_reached',
        message: `You've used all ${tokenLimit.toLocaleString()} tokens for this month (${plan} plan). Resets on the 1st of next month.`,
        tokensUsed: currentTokens,
        tokenLimit,
        plan,
      }, { status: 429 });
    }

    // ── Call Anthropic API ───────────────────────────────────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: `You are a global opportunity analyst. Given a user profile, identify 8 highly relevant opportunities across jobs, education, and migration.

Return ONLY a valid JSON array with no markdown, no explanation, no backticks. Each item must have exactly these fields:
- id (number)
- title (string)
- org (string, include city/country)
- type ("job" | "education" | "migration")
- country (string)
- description (string, max 120 chars)
- matchScore (number between 70-99)
- deadline (string, e.g. "Apr 30, 2026" or "Rolling")
- requirements (array of 2-3 short strings)
- url (string) — a real working https:// link directly to the opportunity. For jobs: the company careers page. For education: official scholarship application page. For migration: official government immigration page.

Every url must start with https://. Make all opportunities realistic and tailored to the profile. Include a mix of job, education, and migration types.`,
        messages: [{ role: 'user', content: `Analyse this profile and return 8 opportunities as a JSON array:\n\n${profileSummary}` }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return Response.json({ error: 'AI service error', detail: response.status }, { status: 502 });
    }

    const data = await response.json();
    const raw  = data.content?.map((i) => i.text || '').join('').trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const opportunities = JSON.parse(clean);

    // ── Record actual tokens used ────────────────────────────────────────────
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    if (tokensUsed > 0) {
      try { await recordUsage(supabase, userId, monthKey, tokensUsed); }
      catch (e) { console.warn('Failed to record usage:', e.message); }
    }

    return Response.json({ opportunities, usage: { tokensUsed, tokenLimit, plan } });

  } catch (err) {
    console.error('Analyze route error:', err);
    return Response.json({ error: 'Failed to analyse profile' }, { status: 500 });
  }
}
