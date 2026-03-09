export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let cache = { posts: null, generatedAt: null };

export async function GET(req) {
  try {
    const now = Date.now();
    const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1';

    if (!forceRefresh && cache.posts && cache.generatedAt && (now - cache.generatedAt) < CACHE_TTL_MS) {
      return Response.json({ posts: cache.posts, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true });
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
        system: `You are a content curator for a global opportunities platform covering jobs, education, scholarships, and migration.
Today's date is ${today}.
Return ONLY a valid JSON array with no markdown, no backticks, no explanation.

Each item must have exactly these fields:
- id (number 1-6)
- tag (one of: Career/Education/Migration/Finance/Lifestyle/Policy)
- emoji (single relevant emoji)
- title (string, engaging article-style headline)
- excerpt (string, 1-2 sentence teaser, max 140 chars)
- date (a recent date close to today, formatted like "Mar 4, 2026")
- readTime (e.g. "4 min read")
- bg (one of: #f0f4f8/#f8f4f0/#f0f8f4/#f8f0f4/#f4f8f0/#f0f0f8)
- url (a real working search URL from the list below — use exact format shown)

Use these search URLs — one per post, all different:
1. https://www.google.com/search?q=how+to+move+abroad+for+work+2026
2. https://www.google.com/search?q=best+countries+for+skilled+workers+2026
3. https://www.google.com/search?q=international+scholarship+guide+2026
4. https://www.google.com/search?q=remote+work+visa+digital+nomad+2026
5. https://www.google.com/search?q=express+entry+canada+tips+2026
6. https://www.google.com/search?q=germany+job+seeker+visa+guide+2026
7. https://www.google.com/search?q=uk+graduate+visa+opportunities+2026
8. https://www.google.com/search?q=australia+skilled+migration+guide+2026
9. https://www.google.com/search?q=fully+funded+masters+scholarships+2026
10. https://www.google.com/search?q=highest+paying+jobs+abroad+2026
11. https://www.google.com/search?q=singapore+work+visa+guide+2026
12. https://www.google.com/search?q=europe+blue+card+skilled+workers+2026

Pick the 6 most relevant for your chosen topics. Write headlines and excerpts that match each search topic.`,
        messages: [{
          role: 'user',
          content: 'Generate 6 blog post entries about global opportunities. Each must use a different search URL. Return only the JSON array.'
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
    const posts = JSON.parse(clean);

    cache = { posts, generatedAt: now };
    return Response.json({ posts, generatedAt: new Date(now).toISOString(), cached: false });

  } catch (err) {
    console.error('Blog generation error:', err);
    if (cache.posts) {
      return Response.json({ posts: cache.posts, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true, stale: true });
    }
    return Response.json({ error: 'Failed to generate blog posts' }, { status: 500 });
  }
}
