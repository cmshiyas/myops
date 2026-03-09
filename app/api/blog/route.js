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

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    };

    const model = 'claude-haiku-4-5-20251001';
    const tools = [{ type: 'web_search_20250305', name: 'web_search' }];

    const systemPrompt = `You are a content curator for a global opportunities platform covering jobs, education, scholarships, and migration.
Today's date is ${today}.
Use the web_search tool to find 6 real, recent articles about careers, education, scholarships, migration, or global opportunities.
After searching, return ONLY a valid JSON array with no markdown, no backticks, no explanation.
Each item must have exactly:
- id (number 1-6)
- tag (one of: Career/Education/Migration/Finance/Lifestyle/Policy)
- emoji (single relevant emoji)
- title (the real article headline from search results)
- excerpt (1-2 sentence summary, max 140 chars)
- date (article publication date, formatted like "Mar 4, 2026")
- readTime (estimated read time e.g. "4 min read")
- bg (one of: #f0f4f8/#f8f4f0/#f0f8f4/#f8f0f4/#f4f8f0/#f0f0f8)
- url (the exact URL from search results — direct article link)`;

    let messages = [{
      role: 'user',
      content: 'Search for 6 recent articles about global opportunities (careers, education, scholarships, migration). Return only the JSON array.'
    }];

    let iterations = 0;
    while (iterations < 8) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, max_tokens: 4000, tools, system: systemPrompt, messages }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Claude API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      iterations++;

      if (data.stop_reason === 'end_turn') {
        const raw = data.content
          ?.filter(b => b.type === 'text')
          ?.map(b => b.text || '')
          .join('')
          .trim();
        if (!raw) throw new Error('Empty response from Claude');
        const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        const posts = JSON.parse(clean);
        cache = { posts, generatedAt: now };
        return Response.json({ posts, generatedAt: new Date(now).toISOString(), cached: false });
      }

      if (data.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: data.content });
        const toolUseBlocks = data.content.filter(b => b.type === 'tool_use');
        messages.push({
          role: 'user',
          content: toolUseBlocks.map(b => ({
            type: 'tool_result',
            tool_use_id: b.id,
            content: 'Search executed successfully.',
          })),
        });
        continue;
      }

      break;
    }

    throw new Error('Max iterations reached without final response');

  } catch (err) {
    console.error('Blog generation error:', err.message);
    if (cache.posts) {
      return Response.json({ posts: cache.posts, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true, stale: true });
    }
    return Response.json({ error: 'Failed to generate blog posts' }, { status: 500 });
  }
}
