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
    const year = new Date().getFullYear();

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    };

    const model = 'claude-haiku-4-5-20251001';
    const tools = [{ type: 'web_search_20250305', name: 'web_search' }];

    const systemPrompt = `You are a news and trends curator for a global opportunities platform covering jobs, immigration, scholarships, and education. Today's date is ${today}.

Your task: run 3 targeted web searches, then compile the 6 best real articles into a JSON array.

Run these 3 searches in order:
1. "immigration visa policy news ${year}" — find 2 recent news articles about visa or immigration changes
2. "international scholarship job opportunities ${year}" — find 2 articles about scholarships or global job market
3. "remote work abroad education career trends ${year}" — find 2 articles about career or education trends

After all 3 searches, return ONLY a valid JSON array — no markdown, no backticks, no explanation.
Each of the 6 items must have exactly:
- id (number 1-6)
- tag (one of: Career/Education/Migration/Finance/Lifestyle/Policy)
- emoji (single relevant emoji)
- title (exact headline from the article)
- excerpt (1-2 sentences max 140 chars — what the article actually covers)
- date (real publication date formatted like "Mar 4, 2026")
- readTime (estimated read time e.g. "4 min read")
- bg (cycle through: #f0f4f8, #f8f4f0, #f0f8f4, #f8f0f4, #f4f8f0, #f0f0f8 — one per item)
- url (exact direct article URL from search results — never a homepage)

Only include articles published in the last 90 days. Prefer reputable outlets: BBC, Reuters, Guardian, Forbes, official government or university sites.`;

    let messages = [{
      role: 'user',
      content: 'Run your 3 searches now and return the JSON array of 6 real articles.'
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
    console.error('Blog/News generation error:', err.message);
    if (cache.posts) {
      return Response.json({ posts: cache.posts, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true, stale: true });
    }
    return Response.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
