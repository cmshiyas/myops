export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let cache = { items: null, generatedAt: null };

export async function GET(req) {
  try {
    const now = Date.now();
    const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1';

    if (!forceRefresh && cache.items && cache.generatedAt && (now - cache.generatedAt) < CACHE_TTL_MS) {
      return Response.json({ items: cache.items, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true });
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
- id (number 1-6)
- badge (short uppercase: POLICY/SCHOLARSHIPS/TECH JOBS/MIGRATION/EDUCATION/VISA/REMOTE WORK)
- title (string, realistic news headline)
- desc (string, 1-2 sentences max 160 chars)
- date (a recent date close to today)
- urgent (boolean)
- url (a real, working search URL from the list below — use the exact format shown)

Use these search URLs — one per item, all different:
1. https://www.google.com/search?q=canada+express+entry+immigration+2026
2. https://www.google.com/search?q=chevening+scholarship+2026+applications
3. https://www.google.com/search?q=germany+opportunity+card+visa+2026
4. https://www.google.com/search?q=uk+skilled+worker+visa+changes+2026
5. https://www.google.com/search?q=remote+work+jobs+abroad+2026
6. https://www.google.com/search?q=australia+skilled+migration+visa+2026
7. https://www.google.com/search?q=fulbright+scholarship+2026+apply
8. https://www.google.com/search?q=tech+jobs+europe+2026+hiring
9. https://www.google.com/search?q=erasmus+scholarship+2026
10. https://www.google.com/search?q=singapore+employment+pass+2026
11. https://www.google.com/search?q=daad+scholarship+germany+2026
12. https://www.google.com/search?q=new+zealand+skilled+migrant+visa+2026

Pick the 6 most relevant URLs for your chosen news topics. Write headlines and descriptions that match the search topic.`,
        messages: [{
          role: 'user',
          content: 'Generate 6 news items about global opportunities. Each must use a different search URL from the list. Return only the JSON array.'
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude error: ${response.status} — ${errText}`);
    }

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
