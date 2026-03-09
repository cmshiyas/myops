export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let cache = { posts: null, generatedAt: null };

// Fallback posts used when Claude/web_search fails
const FALLBACK_POSTS = [
  { id:1, tag:'Migration', emoji:'✈️', title:'Express Entry: Canada Opens New Draw for Skilled Workers', excerpt:'Canada continues to welcome skilled professionals through its Express Entry system with competitive CRS score draws.', date:'Mar 2026', readTime:'3 min read', bg:'#f0f4f8', url:'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html' },
  { id:2, tag:'Education', emoji:'🎓', title:'Chevening Scholarships 2026 Now Open for Applications', excerpt:'The UK government is offering fully-funded scholarships for outstanding individuals to study in the UK.', date:'Mar 2026', readTime:'4 min read', bg:'#f8f4f0', url:'https://www.chevening.org/scholarships/' },
  { id:3, tag:'Career', emoji:'💼', title:'Germany Opportunity Card: A New Path for Skilled Workers', excerpt:'Germany\'s new points-based Opportunity Card allows skilled workers to move to Germany to seek employment.', date:'Mar 2026', readTime:'5 min read', bg:'#f0f8f4', url:'https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card' },
  { id:4, tag:'Policy', emoji:'📋', title:'UK Skilled Worker Visa: Latest Updates and Requirements', excerpt:'The UK continues to update its skilled worker visa pathway for international professionals across key sectors.', date:'Mar 2026', readTime:'3 min read', bg:'#f8f0f4', url:'https://www.gov.uk/skilled-worker-visa' },
  { id:5, tag:'Lifestyle', emoji:'🌍', title:'Top Countries Embracing Remote Work Visas in 2026', excerpt:'More countries are launching dedicated remote work visa programmes to attract global digital talent.', date:'Mar 2026', readTime:'4 min read', bg:'#f4f8f0', url:'https://nomadlist.com' },
  { id:6, tag:'Education', emoji:'📚', title:'DAAD Scholarships: Study in Germany Fully Funded', excerpt:'The German Academic Exchange Service offers hundreds of scholarships for international students at all levels.', date:'Mar 2026', readTime:'3 min read', bg:'#f0f0f8', url:'https://www.daad.de/en/study-and-research-in-germany/scholarships/' },
];

async function fetchWithWebSearch(apiKey, today, year) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'web-search-2025-03-05',
  };

  const model = 'claude-haiku-4-5-20251001';
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }];

  const systemPrompt = `You are a news and trends curator for a global opportunities platform. Today's date is ${today}.

Run 3 targeted web searches then compile 6 real articles into a JSON array.

Search order:
1. "immigration visa policy news ${year}"
2. "international scholarship job opportunities ${year}"  
3. "remote work abroad education career trends ${year}"

Return ONLY a valid JSON array — no markdown, no backticks, no explanation.
Each item must have exactly:
- id (number 1-6)
- tag (Career/Education/Migration/Finance/Lifestyle/Policy)
- emoji (single relevant emoji)
- title (exact article headline)
- excerpt (1-2 sentences max 140 chars)
- date (publication date like "Mar 4, 2026")
- readTime (e.g. "4 min read")
- bg (cycle: #f0f4f8, #f8f4f0, #f0f8f4, #f8f0f4, #f4f8f0, #f0f0f8)
- url (direct article URL — not a homepage)

Only articles from last 90 days. Prefer BBC, Reuters, Guardian, Forbes, official government/university sites.`;

  let messages = [{ role: 'user', content: 'Run your 3 searches now and return the JSON array of 6 real articles.' }];
  let iterations = 0;

  while (iterations < 8) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, max_tokens: 4000, tools, system: systemPrompt, messages }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Claude API ${res.status}: ${errText}`);
    }

    const data = await res.json();
    iterations++;

    console.log(`[blog] iteration ${iterations}, stop_reason: ${data.stop_reason}, blocks: ${data.content?.length}`);

    if (data.stop_reason === 'end_turn') {
      const raw = data.content
        ?.filter(b => b.type === 'text')
        ?.map(b => b.text || '')
        .join('')
        .trim();
      if (!raw) throw new Error('Empty text response');
      const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      return JSON.parse(clean);
    }

    if (data.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: data.content });
      const toolUseBlocks = data.content.filter(b => b.type === 'tool_use');
      messages.push({
        role: 'user',
        content: toolUseBlocks.map(b => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: 'Search executed.',
        })),
      });
      continue;
    }

    throw new Error(`Unexpected stop_reason: ${data.stop_reason}`);
  }

  throw new Error('Max iterations reached');
}

export async function GET(req) {
  const now = Date.now();

  try {
    const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1';

    if (!forceRefresh && cache.posts && cache.generatedAt && (now - cache.generatedAt) < CACHE_TTL_MS) {
      return Response.json({ posts: cache.posts, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'Not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const year = new Date().getFullYear();

    try {
      const posts = await fetchWithWebSearch(apiKey, today, year);
      cache = { posts, generatedAt: now };
      return Response.json({ posts, generatedAt: new Date(now).toISOString(), cached: false });
    } catch (claudeErr) {
      // Claude/web_search failed — log and serve fallback so UI never breaks
      console.error('[blog] Claude error, serving fallback:', claudeErr.message);
      const fallback = FALLBACK_POSTS.map(p => ({ ...p, date: `Mar ${year}` }));
      return Response.json({ posts: fallback, generatedAt: new Date(now).toISOString(), cached: false, fallback: true });
    }

  } catch (err) {
    console.error('[blog] Route error:', err.message);
    if (cache.posts) {
      return Response.json({ posts: cache.posts, generatedAt: new Date(cache.generatedAt).toISOString(), cached: true, stale: true });
    }
    // Last resort — serve fallback instead of 500
    return Response.json({ posts: FALLBACK_POSTS, generatedAt: new Date(now).toISOString(), cached: false, fallback: true });
  }
}
