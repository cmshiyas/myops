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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: `You are a news curator for a global opportunities platform. Today's date is ${today}.
Return ONLY a valid JSON array with no markdown, no backticks, no explanation.

Each item must have exactly these fields:
- id (number)
- badge (short uppercase label: POLICY/SCHOLARSHIPS/TECH JOBS/MIGRATION/EDUCATION/VISA/REMOTE WORK)
- title (string, news headline style)
- desc (string, 1-2 sentences max 160 chars)
- date (recent date like "March 6, 2026")
- urgent (boolean)
- url (string) — a REAL working https:// URL from the trusted list below only

Use ONLY these trusted URLs (copy them exactly):
1. https://www.canada.ca/en/immigration-refugees-citizenship/news.html
2. https://www.make-it-in-germany.com/en/living-in-germany/news
3. https://www.chevening.org/news/
4. https://ec.europa.eu/social/main.jsp?catId=89&langId=en
5. https://www.gov.uk/browse/visas-immigration
6. https://www.uscis.gov/newsroom
7. https://www.ilo.org/global/about-the-ilo/newsroom/lang--en/index.htm
8. https://www.topuniversities.com/student-info/scholarship-advice
9. https://nomadlist.com/blog
10. https://www.daad.de/en/the-daad/press-and-communications/press-releases/
11. https://www.bbc.com/news/education
12. https://www.theguardian.com/world/migration

Use a different url for each of the 6 news items.`,
        messages: [{
          role: 'user',
          content: 'Generate 6 news items about global job markets, immigration policy, scholarships, and education. Each must use a different url from the trusted list. Return only the JSON array.'
        }],
      }),
    });

    if (!response.ok) throw new Error(`Claude error: ${response.status}`);

    const data = await response.json();
    const raw = data.content?.map(i => i.text || '').join('').trim();
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
