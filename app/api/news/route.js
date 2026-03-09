export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let cache = { items: null, generatedAt: null };

export async function GET(req) {
  try {
    const now = Date.now();
    const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1';

    if (!forceRefresh && cache.items && cache.generatedAt && (now - cache.generatedAt) < CACHE_TTL_MS) {
      return Response.json({
        items: cache.items,
        generatedAt: new Date(cache.generatedAt).toISOString(),
        cached: true,
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'Not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Use web_search tool so Claude finds real articles with real URLs
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are a news curator for a global opportunities platform. Today's date is ${today}.
Search for 6 real, current news articles about: immigration policy, global job markets, international scholarships, visa changes, remote work, or education opportunities.
After searching, return ONLY a valid JSON array with no markdown, no backticks, no explanation.
Each item must have exactly:
- id (number 1-6)
- badge (short uppercase: POLICY/SCHOLARSHIPS/TECH JOBS/MIGRATION/EDUCATION/VISA/REMOTE WORK)
- title (the real article headline)
- desc (1-2 sentences, max 160 chars, summarising the article)
- date (the article's publication date, e.g. "March 6, 2026")
- urgent (boolean — true if time-sensitive)
- url (the real direct URL to the article — must be the actual article link, not a homepage)`,
        messages: [{
          role: 'user',
          content: 'Search for 6 recent news articles about global opportunities (immigration, jobs, scholarships, visas, education). Return only the JSON array with real article URLs.'
        }],
      }),
    });

    if (!response.ok) throw new Error(`Claude error: ${response.status}`);

    const data = await response.json();
    // Collect only text blocks — skip tool_use and tool_result blocks
    const raw = data.content
      ?.filter(i => i.type === 'text')
      ?.map(i => i.text || '')
      .join('')
      .trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const items = JSON.parse(clean);

    cache = { items, generatedAt: now };

    return Response.json({ items, generatedAt: new Date(now).toISOString(), cached: false });
  } catch (err) {
    console.error('News generation error:', err);
    if (cache.items) {
      return Response.json({ items: cache.items, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true, stale: true });
    }
    return Response.json({ error: 'Failed to generate news' }, { status: 500 });
  }
}
