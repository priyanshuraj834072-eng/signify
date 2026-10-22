// Vercel serverless function: keeps the YouTube API key on the server.
// Set the key in Vercel: Project Settings -> Environment Variables -> YT_KEY
const ALLOWED_PATHS = ['search', 'videos'];
const ALLOWED_PARAMS = ['part', 'type', 'videoCategoryId', 'videoEmbeddable', 'maxResults', 'q', 'chart', 'regionCode'];

module.exports = async (req, res) => {
  const key = process.env.YT_KEY;
  if (!key) return res.status(500).json({ error: { message: 'Server key is not set (YT_KEY).' } });

  const path = String((req.query && req.query.path) || '');
  if (!ALLOWED_PATHS.includes(path)) return res.status(400).json({ error: { message: 'Bad request.' } });

  const params = new URLSearchParams();
  for (const k of ALLOWED_PARAMS) {
    if (req.query && req.query[k] !== undefined) params.set(k, String(req.query[k]).slice(0, 200));
  }
  if (Number(params.get('maxResults')) > 25) params.set('maxResults', '25');
  params.set('key', key);

  try {
    const r = await fetch('https://www.googleapis.com/youtube/v3/' + path + '?' + params.toString());
    const data = await r.json();
    if (r.ok) {
      // Cache on Vercel's CDN so repeated searches do not use up the daily quota.
      const isChannel = params.get('type') === 'channel';
      const secs = path === 'videos' ? 3600 : isChannel ? 2592000 : 86400;
      res.setHeader('Cache-Control', 'public, s-maxage=' + secs + ', stale-while-revalidate=' + secs);
    }
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: { message: 'Could not reach YouTube.' } });
  }
};
