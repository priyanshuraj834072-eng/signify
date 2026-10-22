// Vercel serverless function: forwards requests to the API set in MUSIC_API_URL
module.exports = async (req, res) => {
  const base = (process.env.MUSIC_API_URL || '').replace(/\/$/, '');
  if (!base) return res.status(500).json({ error: 'MUSIC_API_URL not set in Vercel' });
  const { p = '/', ...rest } = req.query;
  if (!String(p).startsWith('/')) return res.status(400).json({ error: 'bad path' });
  try {
    const r = await fetch(base + p + '?' + new URLSearchParams(rest));
    const text = await r.text();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
