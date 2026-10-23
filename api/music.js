// Vercel serverless function: sirf logged-in (Firebase) users ke liye music API proxy
const crypto = require('crypto');
const BASE = () => (process.env.MUSIC_API_URL || '').replace(/\/$/, '');
const PROJECT = process.env.FIREBASE_PROJECT_ID || 'singify-e6614';
const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certs = null, certsExp = 0;
async function getCerts() {
  if (certs && Date.now() < certsExp) return certs;
  const r = await fetch(CERT_URL);
  const m = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  certs = await r.json();
  certsExp = Date.now() + (m ? +m[1] : 3600) * 1000;
  return certs;
}

// Firebase ID token verify (RS256, Google ki public keys se)
async function verify(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  let h, p;
  try {
    h = JSON.parse(Buffer.from(parts[0], 'base64url'));
    p = JSON.parse(Buffer.from(parts[1], 'base64url'));
  } catch (e) { return null; }
  const now = Math.floor(Date.now() / 1000);
  if (h.alg !== 'RS256') return null;
  if (p.aud !== PROJECT || p.iss !== 'https://securetoken.google.com/' + PROJECT) return null;
  if (!p.sub || p.exp <= now || p.iat > now + 60) return null;
  const cert = (await getCerts())[h.kid];
  if (!cert) return null;
  const ok = crypto.createVerify('RSA-SHA256')
    .update(parts[0] + '.' + parts[1])
    .verify(cert, Buffer.from(parts[2], 'base64url'));
  return ok ? p : null;
}

// halka rate limit: ek user ke liye 1 minute mein 150 requests (har instance par alag)
const hits = new Map();
function limited(uid) {
  const now = Date.now(), e = hits.get(uid);
  if (!e || now - e.t > 60000) { hits.set(uid, { t: now, n: 1 }); return false; }
  return ++e.n > 150;
}

module.exports = async (req, res) => {
  const base = BASE();
  if (!base) return res.status(500).json({ error: 'MUSIC_API_URL not set in Vercel' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let user = null;
  try { user = await verify(token); } catch (e) {}
  if (!user) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({ error: 'login required' });
  }
  if (limited(user.sub)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(429).json({ error: 'too many requests' });
  }

  const { p = '/', ...rest } = req.query;
  const path = String(p);
  if (!(path.startsWith('/api/') || path.startsWith('/result/')) || path.includes('..')) {
    return res.status(400).json({ error: 'bad path' });
  }
  try {
    const r = await fetch(base + path + '?' + new URLSearchParams(rest));
    const text = await r.text();
    // sirf browser mein cache (private), CDN mein nahi: warna bina login wale ko bhi mil jata
    res.setHeader('Cache-Control', r.ok ? 'private, max-age=300' : 'no-store');
    res.setHeader('Vary', 'Authorization');
    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(text);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: String(e) });
  }
};
