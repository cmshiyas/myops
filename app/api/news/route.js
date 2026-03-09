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

    // web_search is a server-side tool — Anthropic executes searches on their end.
    // Claude will search, get real results with real URLs, then return the JSON.
    // We just need to keep sending the conversation back until stop_reason is end_turn.
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    };

    const model = 'claude-haiku-4-5-20251001';
    const tools = [{ type: 'web_search_20250305', name: 'web_search' }];

    const systemPrompt = `You are a news curator for a global opportunities platform. Today's date is ${today}.
Use the web_search tool to find 6 real, current news articles about: immigration policy, global job markets, international scholarships, visa changes, remote work, or education opportunities.
After searching, return ONLY a valid JSON array with no markdown, no backticks, no explanation.
Each item must have exactly:
- id (number 1-6)
- badge (short uppercase: POLICY/SCHOLARSHIPS/TECH JOBS/MIGRATION/EDUCATION/VISA/REMOTE WORK)
- title (the real article headline from search results)
- desc (1-2 sentences, max 160 chars, summarising the article)
- date (the article publication date e.g. "March 6, 2026")
- urgent (boolean — true if time-sensitive)
- url (the exact URL from search results — direct article link)`;

    let messages = [{
      role: 'user',
      content: 'Search for 6 recent news articles about global opportunities. Return only the JSON array.'
    }];

    // Loop until Claude finishes using tools and returns final text
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

      // Claude finished — extract the JSON text
      if (data.stop_reason === 'end_turn') {
        const raw = data.content
          ?.filter(b => b.type === 'text')
          ?.map(b => b.text || '')
          .join('')
          .trim();
        if (!raw) throw new Error('Empty response from Claude');
        const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        const items = JSON.parse(clean);
        cache = { items, generatedAt: now };
        return Response.json({ items, generatedAt: new Date(now).toISOString(), cached: false });
      }

      // Claude used a tool — append its response to messages and continue
      // For server-side tools (web_search), Anthropic handles execution automatically.
      // We just need to append the assistant turn and send back to continue.
      if (data.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: data.content });
        // For server-executed tools, we send an empty user turn to continue
        // The actual search results are embedded in the next assistant response
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

      // Unexpected stop reason
      break;
    }

    throw new Error('Max iterations reached without final response');

  } catch (err) {
    console.error('News generation error:', err.message);
    if (cache.items) {
      return Response.json({ items: cache.items, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true, stale: true });
    }
    return Response.json({ error: 'Failed to generate news' }, { status: 500 });
  }
}
