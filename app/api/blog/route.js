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
        max_tokens: 1500,
        system: `You are a content writer for a global opportunities platform covering jobs, education, scholarships, and migration. 
Today's date is ${today}.
Return ONLY a valid JSON array with no markdown, no backticks, no explanation.
Each item must have exactly: id (number), tag (one of: Career/Education/Migration/Finance/Lifestyle/Policy), emoji (single relevant emoji), title (string, engaging headline), excerpt (string, 1-2 sentence teaser, max 140 chars), date (formatted like "Mar 4, 2026"), readTime (e.g. "4 min read"), bg (one of: #f0f4f8/#f8f4f0/#f0f8f4/#f8f0f4/#f4f8f0/#f0f0f8).`,
        messages: [{
          role: 'user',
          content: 'Generate 6 blog posts about current global trends in jobs, education, scholarships, and migration. Make titles specific, timely, and useful. Vary the tags. Return only the JSON array.'
        }],
      }),
    });

    if (!response.ok) throw new Error(`Claude error: ${response.status}`);

    const data = await response.json();
    const raw = data.content?.map(i => i.text || '').join('').trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const posts = JSON.parse(clean);

    return Response.json({ posts, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Blog generation error:', err);
    return Response.json({ error: 'Failed to generate blog posts' }, { status: 500 });
  }
}
