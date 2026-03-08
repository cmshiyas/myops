import { createClient } from '@supabase/supabase-js';

const PLAN_TOKEN_LIMITS = {
  silver:   1000,
  gold:     5000,
  platinum: 15000,
};

// Trusted URL pools per category — Claude must pick from these
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

export async function POST(req) {
  try {
    const { profileSummary, userId } = await req.json();

    if (!profileSummary) return Response.json({ error: 'No profile data provided' }, { status: 400 });
    if (!userId) return Response.json({ error: 'Authentication required' }, { status: 401 });

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
      monthKey = usage.monthKey;
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

    // Build trusted URL lists for the prompt
    const jobUrls     = TRUSTED_URLS.job.map((u,i) => `${i+1}. ${u}`).join('\n');
    const eduUrls     = TRUSTED_URLS.education.map((u,i) => `${i+1}. ${u}`).join('\n');
    const migUrls     = TRUSTED_URLS.migration.map((u,i) => `${i+1}. ${u}`).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `You are a global opportunity analyst. Given a user profile, identify exactly 20 highly relevant opportunities — a mix of jobs, education/scholarships, and migration pathways.

IMPORTANT RULES:
1. Return ONLY a valid JSON array, no markdown, no explanation, no backticks.
2. Include exactly 20 items: approximately 8 jobs, 6 education, 6 migration.
3. For matchScore: calculate it PROPERLY based on how well the opportunity matches the user's profile:
   - Start at 50
   - +10 if the opportunity type matches their stated interests
   - +10 if their skills/education directly match the requirements
   - +10 if location/country preference aligns
   - +10 if experience level matches
   - +5 if language requirements are met
   - +5 if deadline is upcoming/rolling (not past)
   - Cap at 98. Never invent a score — derive it from profile fit.
4. For url: ONLY use URLs from the trusted lists below. Copy them exactly.
5. Sort results by matchScore descending.

TRUSTED JOB URLs (pick the most relevant for each job opportunity):
${jobUrls}

TRUSTED EDUCATION URLs (pick the most relevant for each scholarship/program):
${eduUrls}

TRUSTED MIGRATION URLs (pick the most relevant for each pathway):
${migUrls}

Each item must have exactly these fields:
- id (number 1-20)
- title (string — specific role/program name)
- org (string — organisation name + city/country)
- type ("job" | "education" | "migration")
- country (string)
- description (string, max 120 chars, specific to the opportunity)
- matchScore (number, calculated as described above)
- matchReason (string, 1 sentence explaining WHY this matches the profile)
- deadline (string, e.g. "Apr 30, 2026" or "Rolling")
- requirements (array of exactly 3 short strings)
- url (string — copied exactly from the trusted URL list above)`,
        messages: [{
          role: 'user',
          content: `Analyse this profile and return exactly 20 opportunities as a JSON array, sorted by matchScore descending:\n\n${profileSummary}`,
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return Response.json({ error: 'AI service error', detail: response.status }, { status: 502 });
    }

    const data = await response.json();
    const raw   = data.content?.map(i => i.text || '').join('').trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const opportunities = JSON.parse(clean);

    // Record tokens used
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    if (tokensUsed > 0) {
      try { await recordUsage(supabase, userId, monthKey, tokensUsed); }
      catch (e) { console.warn('Failed to record usage:', e.message); }
    }

    const totalUsed   = currentTokens + tokensUsed;
    const percentUsed = tokenLimit > 0 ? Math.min(100, Math.round((totalUsed / tokenLimit) * 100)) : 0;
    const now2        = new Date();
    const resetDate   = new Date(now2.getFullYear(), now2.getMonth() + 1, 1)
                          .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return Response.json({ opportunities, usage: { tokensUsed: totalUsed, tokenLimit, percentUsed, resetDate, plan } });

  } catch (err) {
    console.error('Analyze route error:', err);
    return Response.json({ error: 'Failed to analyse profile' }, { status: 500 });
  }
}
