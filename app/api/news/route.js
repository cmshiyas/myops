export async function GET() {
  try {
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
        max_tokens: 1200,
        system: `You are a news editor for a global opportunities platform. Today's date is ${today}.
Return ONLY a valid JSON array with no markdown, no backticks, no explanation.
Each item must have exactly: id (number), badge (short uppercase label e.g. POLICY/SCHOLARSHIPS/TECH JOBS/MIGRATION/EDUCATION/VISA), title (string, news headline style), desc (string, 1-2 sentences, max 160 chars), date (recent date formatted like "March 6, 2026"), urgent (boolean, true for breaking/time-sensitive news).`,
        messages: [{
          role: 'user',
          content: 'Generate 6 recent news items about global job markets, immigration policy changes, new scholarship programmes, and education opportunities. Make them feel current and realistic. Return only the JSON array.'
        }],
      }),
    });

    if (!response.ok) throw new Error(`Claude error: ${response.status}`);

    const data = await response.json();
    const raw = data.content?.map(i => i.text || '').join('').trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const items = JSON.parse(clean);

    return Response.json({ items, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('News generation error:', err);
    return Response.json({ error: 'Failed to generate news' }, { status: 500 });
  }
}
