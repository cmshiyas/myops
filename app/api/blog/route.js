const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Server-side in-memory cache — shared across all users, persists across requests
// (Vercel serverless: reused within the same function instance)
let cache = { posts: null, generatedAt: null };

export async function GET(req) {
  try {
    // Serve from cache if fresh
    const now = Date.now();
    const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1';

    if (!forceRefresh && cache.posts && cache.generatedAt && (now - cache.generatedAt) < CACHE_TTL_MS) {
      return Response.json({
        posts: cache.posts,
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
        max_tokens: 2000,
        system: `You are a content curator for a global opportunities platform covering jobs, education, scholarships, and migration.
Today's date is ${today}.
Return ONLY a valid JSON array with no markdown, no backticks, no explanation.

Each item must have exactly these fields:
- id (number)
- tag (one of: Career/Education/Migration/Finance/Lifestyle/Policy)
- emoji (single relevant emoji)
- title (string, engaging headline matching the linked article)
- excerpt (string, 1-2 sentence teaser describing the linked page, max 140 chars)
- date (formatted like "Mar 4, 2026")
- readTime (e.g. "4 min read")
- bg (one of: #f0f4f8/#f8f4f0/#f0f8f4/#f8f0f4/#f4f8f0/#f0f0f8)
- url (string) — a REAL working https:// URL from the trusted list below only

Use ONLY these trusted URLs (copy them exactly):
1. https://www.bbc.com/worklife
2. https://www.theguardian.com/education
3. https://www.theguardian.com/world/migration
4. https://www.chevening.org/scholarships/
5. https://www.gatescambridge.org/apply/
6. https://www.daad.de/en/study-and-research-in-germany/scholarships/
7. https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html
8. https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card
9. https://www.topuniversities.com/student-info/scholarship-advice
10. https://www.internations.org/magazine
11. https://nomadlist.com
12. https://www.ilo.org/global/topics/future-of-work/lang--en/index.htm

Use a different url for each of the 6 posts. Write titles and excerpts that are relevant to each url's topic.`,
        messages: [{
          role: 'user',
          content: 'Generate 6 blog post entries. Each must use a different url from the trusted list. Return only the JSON array.'
        }],
      }),
    });

    if (!response.ok) throw new Error(`Claude error: ${response.status}`);

    const data = await response.json();
    const raw = data.content?.map(i => i.text || '').join('').trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const posts = JSON.parse(clean);

    // Store in server cache
    cache = { posts, generatedAt: now };

    return Response.json({ posts, generatedAt: new Date(now).toISOString(), cached: false });
  } catch (err) {
    console.error('Blog generation error:', err);
    // Return stale cache rather than error if available
    if (cache.posts) {
      return Response.json({ posts: cache.posts, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true, stale: true });
    }
    return Response.json({ error: 'Failed to generate blog posts' }, { status: 500 });
  }
}
