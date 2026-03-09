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

    const systemPrompt = `You are a content curator for a global opportunities platform covering jobs, education, scholarships, and migration.
Today's date is ${today}.
Use the web_search tool to find 6 real, recent articles or pages about careers, education, scholarships, migration, or global opportunities.
After searching, return ONLY a valid JSON array with no markdown, no backticks, no explanation.
Each item must have exactly:
- id (number 1-6)
- tag (one of: Career/Education/Migration/Finance/Lifestyle/Policy)
- emoji (single relevant emoji)
- title (the real article headline)
- excerpt (1-2 sentence summary of the article, max 140 chars)
- date (the article's publication date, formatted like "Mar 4, 2026")
- readTime (estimated read time, e.g. "4 min read")
- bg (one of: #f0f4f8/#f8f4f0/#f0f8f4/#f8f0f4/#f4f8f0/#f0f0f8)
- url (the real direct URL to the article — must link to the specific article, not a homepage)`;

    const userMessage = 'Search for 6 recent articles about global opportunities (careers, education, scholarships, migration). Return only the JSON array with real article URLs.';

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    };

    const body = (messages) => JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: systemPrompt,
      messages,
    });

    const initialRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers,
      body: body([{ role: 'user', content: userMessage }]),
    });

    if (!initialRes.ok) {
      const errText = await initialRes.text();
      throw new Error(`Claude error: ${initialRes.status} — ${errText}`);
    }

    let messages = [{ role: 'user', content: userMessage }];
    let currentData = await initialRes.json();
    let iterations = 0;

    // Agentic loop — keep going until Claude stops using tools
    while (currentData.stop_reason === 'tool_use' && iterations < 5) {
      iterations++;
      messages.push({ role: 'assistant', content: currentData.content });

      const toolResults = currentData.content
        .filter(block => block.type === 'tool_use')
        .map(block => ({
          type: 'tool_result',
          tool_use_id: block.id,
          content: block.input?.query ? `Search completed for: ${block.input.query}` : 'Search completed',
        }));

      messages.push({ role: 'user', content: toolResults });

      const continueRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers,
        body: body(messages),
      });

      if (!continueRes.ok) throw new Error(`Claude continue error: ${continueRes.status}`);
      currentData = await continueRes.json();
    }

    const raw = currentData.content
      ?.filter(i => i.type === 'text')
      ?.map(i => i.text || '')
      .join('')
      .trim();

    if (!raw) throw new Error('No text response from Claude');

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
