const MONTHLY_TOKEN_LIMIT = parseInt(process.env.TOKEN_LIMIT_PER_MONTH || '50000', 10);

async function getUsageThisMonth(userId) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .eq('month', monthKey)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return { tokens: data?.tokens_used || 0, monthKey, supabase };
}

async function recordUsage(supabase, userId, monthKey, newTokens) {
  // Upsert: increment existing row or create new one
  await supabase.rpc('increment_token_usage', {
    p_user_id: userId,
    p_month: monthKey,
    p_tokens: newTokens,
  });
}

export async function POST(req) {
  try {
    const { profileSummary, userId } = await req.json();

    if (!profileSummary) {
      return Response.json({ error: 'No profile data provided' }, { status: 400 });
    }

    // ── Token limit check ──────────────────────────────────────────────────
    let supabaseClient = null;
    let monthKey = null;

    if (userId) {
      try {
        const { tokens, monthKey: mk, supabase } = await getUsageThisMonth(userId);
        supabaseClient = supabase;
        monthKey = mk;

        if (tokens >= MONTHLY_TOKEN_LIMIT) {
          return Response.json({
            error: 'limit_reached',
            message: `You have used all ${MONTHLY_TOKEN_LIMIT.toLocaleString()} tokens for this month. Your limit resets on the 1st of next month.`,
            tokensUsed: tokens,
            tokenLimit: MONTHLY_TOKEN_LIMIT,
          }, { status: 429 });
        }
      } catch (usageErr) {
        // If usage check fails, log but don't block the user
        console.warn('Token usage check failed:', usageErr);
      }
    }

    // ── Call Claude ────────────────────────────────────────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
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
- url (string) — a real working https:// link directly to the opportunity. For jobs: link to the company careers page. For education: link to the official scholarship application page. For migration: link to the official government immigration page. Use only well-known real URLs. Examples: "https://www.chevening.org/scholarships/", "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html", "https://careers.google.com/"

Every url must start with https://. Make all opportunities realistic and genuinely tailored to the profile. Include a mix of job, education, and migration types.`,
        messages: [
          {
            role: 'user',
            content: `Analyse this profile and return 8 opportunities as a JSON array:\n\n${profileSummary}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return Response.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.content?.map((i) => i.text || '').join('').trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const opportunities = JSON.parse(clean);

    // ── Record actual tokens used ──────────────────────────────────────────
    const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;
    if (userId && supabaseClient && monthKey && tokensUsed > 0) {
      try {
        await recordUsage(supabaseClient, userId, monthKey, tokensUsed);
      } catch (recordErr) {
        console.warn('Failed to record token usage:', recordErr);
      }
    }

    return Response.json({
      opportunities,
      usage: {
        tokensUsed,
        tokenLimit: MONTHLY_TOKEN_LIMIT,
      },
    });
  } catch (err) {
    console.error('Analyze route error:', err);
    return Response.json({ error: 'Failed to analyse profile' }, { status: 500 });
  }
}
