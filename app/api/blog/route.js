export const dynamic = 'force-dynamic';

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
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are a content curator for a global opportunities platform covering jobs, education, scholarships, and migration.
Today's date is ${today}.
Search for 6 real, recent articles or pages about careers, education, scholarships, migration, or global opportunities.
After searching, return ONLY a valid JSON array with no markdown, no backticks, no explanation.

Each item must have exactly these fields:
- id (number 1-6)
- tag (one of: Career/Education/Migration/Finance/Lifestyle/Policy)
- emoji (single relevant emoji)
- title (the real article headline)
- excerpt (1-2 sentence summary of the article, max 140 chars)
- date (the article's publication date, formatted like "Mar 4, 2026")
- readTime (estimated read time, e.g. "4 min read")
- bg (one of: #f0f4f8/#f8f4f0/#f0f8f4/#f8f0f4/#f4f8f0/#f0f0f8)
- url (the real direct URL to the article — must link to the specific article, not a homepage)`,
        messages: [{
          role: 'user',
          content: 'Search for 6 recent articles about global opportunities (careers, education, scholarships, migration). Return only the JSON array with real article URLs.'
        }],
      }),
    });

    if (!response.ok) throw new Error(`Claude error: ${response.status}`);

    const data = await response.json();
    const raw = data.content?.filter(i => i.type === 'text')?.map(i => i.text || '').join('').trim();
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
