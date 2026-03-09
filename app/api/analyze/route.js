import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../../../lib/auth';

const PLAN_TOKEN_LIMITS = {
  silver:   1000,
  gold:     5000,
  platinum: 15000,
};

// Full URL pools for Gold/Platinum
const TRUSTED_URLS = {
  job: [
    'https://www.linkedin.com/jobs/',
    'https://www.indeed.com/',
    'https://www.glassdoor.com/Job/index.htm',
    'https://careers.google.com/',
    'https://www.amazon.jobs/',
    'https://careers.microsoft.com/',
    'https://www.lifeatspotify.com/jobs',
    'https://www.metacareers.com/',
    'https://grab.careers/',
    'https://boards.greenhouse.io/',
    'https://jobs.lever.co/',
    'https://deepmind.google/about/careers/',
    'https://www.shopify.com/careers',
    'https://stripe.com/jobs',
    'https://www.airbnb.com/careers',
    'https://jobs.netflix.com/',
    'https://www.apple.com/careers/',
    'https://careers.ibm.com/',
    'https://www.salesforce.com/company/careers/',
    'https://careers.adobe.com/',
  ],
  education: [
    'https://www.chevening.org/scholarships/',
    'https://www.gatescambridge.org/apply/',
    'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    'https://www.topuniversities.com/student-info/scholarship-advice',
    'https://www.fulbright.org.au/scholarships/',
    'https://www.rhodeshouse.ox.ac.uk/scholarships/',
    'https://www.commonwealthscholarships.ac.uk/',
    'https://www.aauw.org/resources/programs/fellowships-grants/',
    'https://www.australiaawards.gov.au/',
    'https://erasmus.ec.europa.eu/opportunities',
    'https://www.mastercardfdn.org/scholars-program/',
    'https://www.adb.org/what-we-do/adb-japan-scholarship-program',
    'https://www.oist.jp/admissions',
    'https://www.kfas.org/en/',
    'https://www.science-fellowship.eu/',
  ],
  migration: [
    'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html',
    'https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card',
    'https://www.gov.uk/skilled-worker-visa',
    'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189',
    'https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations',
    'https://www.newzealandnow.govt.nz/visas/skilled-migrant-category-visa',
    'https://www.dubai.ae/en/living-in-dubai/visas-and-immigration',
    'https://www.mom.gov.sg/passes-and-permits/employment-pass',
    'https://www.nfidigitalnomad.com/',
    'https://visaguide.world/europe/portugal-visa/d8-digital-nomad/',
    'https://www.mjp.gov.pt/APP/TipoVisto/GetTipoVisto/6',
    'https://www.netherlandsworldwide.nl/visas-and-travel/visa-for-the-netherlands/highly-skilled-migrants',
    'https://immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/skilled-migrant-category-resident-visa',
    'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html',
    'https://estonia.ee/e-residency/',
  ],
};

// Compact URL pools for Silver — 5 per category to keep input tokens low
const TRUSTED_URLS_COMPACT = {
  job: [
    'https://www.linkedin.com/jobs/',
    'https://www.indeed.com/',
    'https://careers.google.com/',
    'https://www.amazon.jobs/',
    'https://grab.careers/',
  ],
  education: [
    'https://www.chevening.org/scholarships/',
    'https://www.gatescambridge.org/apply/',
    'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    'https://erasmus.ec.europa.eu/opportunities',
    'https://www.australiaawards.gov.au/',
  ],
  migration: [
    'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html',
    'https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card',
    'https://www.gov.uk/skilled-worker-visa',
    'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189',
    'https://www.mom.gov.sg/passes-and-permits/employment-pass',
  ],
};

let _supabase = null;
function getServerSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _supabase;
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

// Build prompt config based on plan
// Silver: compact URLs, 3 opportunities (1 per category), smaller output budget
// Gold/Platinum: full URLs, 20 opportunities
function buildPromptConfig(plan) {
  const isSilver = plan === 'silver';
  const urls     = isSilver ? TRUSTED_URLS_COMPACT : TRUSTED_URLS;
  const count    = isSilver ? 3 : 20;
  const dist     = isSilver ? '1 job, 1 education, 1 migration' : 'approximately 8 jobs, 6 education, 6 migration';

  const jobUrls = urls.job.map((u,i)      => `${i+1}. ${u}`).join('\n');
  const eduUrls = urls.education.map((u,i) => `${i+1}. ${u}`).join('\n');
  const migUrls = urls.migration.map((u,i) => `${i+1}. ${u}`).join('\n');

  const systemPrompt = `You are a global opportunity analyst. Given a user profile, identify exactly ${count} highly relevant opportunities — ${dist}.

IMPORTANT RULES:
1. Return ONLY a valid JSON array, no markdown, no explanation, no backticks.
2. Include exactly ${count} items: ${dist}.
3. For matchScore: calculate it based on profile fit:
   - Start at 50. +10 skills match. +10 education match. +10 location match. +10 experience match. +5 language match. +5 deadline upcoming. Cap at 98.
4. For url: ONLY use URLs from the trusted lists below. Copy them exactly.
5. Sort by matchScore descending.

TRUSTED JOB URLs:
${jobUrls}

TRUSTED EDUCATION URLs:
${eduUrls}

TRUSTED MIGRATION URLs:
${migUrls}

Each item must have exactly:
- id (number), title, org (with city/country), type ("job"|"education"|"migration"), country
- description (max 100 chars), matchScore, matchReason (1 sentence), deadline
- requirements (array of 3 strings), url (from trusted list above)`;

  const userMessage = `Analyse this profile and return exactly ${count} opportunities as a JSON array:\n\n`;

  // Max output: Silver ~300 tokens (3 compact ops), others up to 4000
  const maxOutputTokens = isSilver ? 300 : 4000;

  // Return urlText so caller can compute estimatedInputTokens after safeSummary is built
  const urlText = jobUrls + eduUrls + migUrls;

  return { systemPrompt, userMessage, urlText, maxOutputTokens, count };
}

export async function POST(req) {
  try {
    // Verify JWT first — userId comes from the verified token, not the request body
    const { userId, error: authError } = await verifyAuth(req);
    if (authError) return authError;

    const { profile: rawProfile } = await req.json();
    if (!rawProfile) return Response.json({ error: 'No profile data provided' }, { status: 400 });

    // Sanitise each field individually — never trust free-text from the client.
    // Building the summary server-side from structured fields prevents prompt injection:
    // a user cannot smuggle "Ignore previous instructions" through a labelled field
    // that gets slotted into a fixed template.
    function sanitiseField(val, maxLen = 100) {
      if (val === null || val === undefined) return '';
      return String(val)
        .slice(0, maxLen)
        .replace(/[\n\r]/g, ' ')   // no newlines — they break prompt structure
        .replace(/[<>]/g, '')        // no angle brackets
        .trim();
    }
    function sanitiseArray(arr, maxItems = 10, maxLen = 50) {
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, maxItems).map(v => sanitiseField(v, maxLen));
    }

    const safeSummary = [
      `Location: ${sanitiseField(rawProfile.city)}, ${sanitiseField(rawProfile.country)}`,
      `Age: ${sanitiseField(rawProfile.age, 3)}`,
      `Education: ${sanitiseField(rawProfile.education)} in ${sanitiseField(rawProfile.field)}`,
      `Experience: ${sanitiseField(rawProfile.experience, 3)} years`,
      `Skills: ${sanitiseArray(rawProfile.skills).join(', ')}`,
      `Interests: ${sanitiseArray(rawProfile.interests).join(', ')}`,
      `Languages: ${sanitiseArray(rawProfile.languages).join(', ')}`,
      `Bio: ${sanitiseField(rawProfile.bio, 300)}`,
    ].join('\n');

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'Server configuration error' }, { status: 500 });

    const supabase = getServerSupabase();

    // Fetch plan server-side — never trust client
    let plan;
    try { plan = await getUserPlan(supabase, userId); }
    catch (e) { return Response.json({ error: 'Could not verify your plan.' }, { status: 403 }); }

    const tokenLimit = PLAN_TOKEN_LIMITS[plan] ?? 0;
    if (tokenLimit === 0) {
      return Response.json({
        error: 'limit_reached',
        message: 'Upgrade to Gold or Platinum to run AI analysis.',
        plan, tokenLimit: 0,
      }, { status: 403 });
    }

    // Check monthly usage
    let monthKey, currentTokens;
    try {
      const usage = await getUsageThisMonth(supabase, userId);
      monthKey      = usage.monthKey;
      currentTokens = usage.tokens;
    } catch (e) {
      return Response.json({ error: 'Could not check token usage.' }, { status: 500 });
    }

    if (currentTokens >= tokenLimit) {
      return Response.json({
        error: 'limit_reached',
        message: `You've used all ${tokenLimit.toLocaleString()} tokens this month (${plan} plan). Resets on the 1st.`,
        tokensUsed: currentTokens, tokenLimit, plan,
      }, { status: 429 });
    }

    const tokensRemaining = tokenLimit - currentTokens;

    // Build plan-appropriate prompt — Silver gets compact prompt to stay within 1k budget
    const { systemPrompt, userMessage, urlText, maxOutputTokens } = buildPromptConfig(plan);

    // Estimate input tokens now that safeSummary is available (chars / 4 + overhead)
    const estimatedInputTokens = Math.ceil((urlText + userMessage + safeSummary).length / 4) + 400;

    // Pre-flight check: ensure input alone doesn't exceed remaining budget
    if (estimatedInputTokens >= tokensRemaining) {
      return Response.json({
        error: 'limit_reached',
        message: `Not enough tokens remaining (${tokensRemaining.toLocaleString()} left). Upgrade or wait for your monthly reset on the 1st.`,
        tokensUsed: currentTokens, tokenLimit, plan,
      }, { status: 429 });
    }

    // Cap output tokens to whatever remains after input — prevents any overage
    const safeMaxOutputTokens = Math.min(maxOutputTokens, tokensRemaining - estimatedInputTokens);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: safeMaxOutputTokens,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: `${userMessage}${safeSummary}` }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return Response.json({ error: 'AI service error', detail: response.status }, { status: 502 });
    }

    const data         = await response.json();
    const raw          = data.content?.map(i => i.text || '').join('').trim();
    const clean        = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const opportunities = JSON.parse(clean);

    // Record actual tokens used (from Anthropic response — always accurate)
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    if (tokensUsed > 0) {
      try { await recordUsage(supabase, userId, monthKey, tokensUsed); }
      catch (e) { console.warn('Failed to record usage:', e.message); }
    }

    const totalUsed   = currentTokens + tokensUsed;
    const percentUsed = Math.min(100, Math.round((totalUsed / tokenLimit) * 100));
    const now2        = new Date();
    const resetDate   = new Date(now2.getFullYear(), now2.getMonth() + 1, 1)
                          .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return Response.json({
      opportunities,
      usage: { tokensUsed: totalUsed, tokenLimit, percentUsed, resetDate, plan },
    });

  } catch (err) {
    console.error('Analyze route error:', err);
    return Response.json({ error: 'Failed to analyse profile' }, { status: 500 });
  }
}
