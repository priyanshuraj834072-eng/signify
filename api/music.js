// Singify music proxy (Vercel serverless function, /api/music)
// - The song-API mirrors live ONLY here, never in the browser, so a copy of index.html is useless on its own.
// - Everyone (guest or logged in) gets the same speed and the same limit. A Firebase token is optional:
//   if it is valid we count requests per user, otherwise per IP. Same limit either way.
// - Mirrors are tried one after another (healthy one first), each with a timeout.
//
// Optional Vercel env vars (you can leave both unset):
//   MUSIC_MIRRORS  comma separated list of API base urls, tried in this order
//   MUSIC_API_URL  one extra base url that is tried first (old setting, still works)
const crypto = require('crypto');

const DEFAULT_MIRRORS = ['https://jiosavan-azure.vercel.app', 'https://saavn.dev'];
const clean = u => String(u || '').trim().replace(/\/+$/, '').replace(/^https:\/\//i, 'https://');
const MIRRORS = () => {
  const env = (process.env.MUSIC_MIRRORS || '').split(',').map(clean).filter(Boolean);
  const one = clean(process.env.MUSIC_API_URL);
  const list = [...(one ? [one] : []), ...(env.length ? env : DEFAULT_MIRRORS)];
  return [...new Set(list)].filter(u => /^https:\/\//i.test(u));
};

const PROJECT = process.env.FIREBASE_PROJECT_ID || 'singify-e6614';
const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const TIMEOUT = 8000;           // per mirror
const LIMIT = 240;              // requests per minute, same for everybody
const BAD_FOR = 60000;          // a failing mirror is skipped for 1 minute

let certs = null, certsExp = 0;
async function getCerts() {
  if (certs && Date.now() < certsExp) return certs;
  const r = await fetch(CERT_URL);
  const m = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  certs = await r.json();
  certsExp = Date.now() + (m ? +m[1] : 3600) * 1000;
  return certs;
}

// Firebase ID token check (RS256 with Google's public keys). Returns the payload or null.
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

// light rate limit (per server instance)
const hits = new Map();
function limited(key) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.t > 60000) hits.delete(k);
  const e = hits.get(key);
  if (!e || now - e.t > 60000) { hits.set(key, { t: now, n: 1 }); return false; }
  return ++e.n > LIMIT;
}

const clientIp = req => String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();

// Without a token the request must come from a page on this same site (blocks plain curl/scripts).
function fromOurSite(req) {
  const sfs = req.headers['sec-fetch-site'];
  if (sfs) return sfs === 'same-origin';
  try { return new URL(req.headers.referer || '').host === req.headers.host; } catch (e) { return false; }
}

// mirror health: remember who answered last, skip failing ones for a while
const badUntil = new Map();
let lastGood = '';
function order() {
  const all = MIRRORS(), now = Date.now();
  const live = all.filter(b => (badUntil.get(b) || 0) < now);
  const list = live.length ? live : all;
  return lastGood && list.includes(lastGood) ? [lastGood, ...list.filter(b => b !== lastGood)] : list;
}

async function ask(base, pathAndQuery) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(base + pathAndQuery, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    const text = await r.text();
    let j = null;
    try { j = JSON.parse(text); } catch (e) { /* html error page, paused deployment ... */ }
    if (!r.ok || !j || j.success === false) return { ok: false, status: r.status, text };
    return { ok: true, status: r.status, text };
  } catch (e) {
    return { ok: false, status: 0, text: String(e && e.name === 'AbortError' ? 'timeout' : e) };
  } finally {
    clearTimeout(t);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Vary', 'Authorization');
  const fail = (code, msg) => { res.setHeader('Cache-Control', 'no-store'); return res.status(code).json({ error: msg }); };

  const mirrors = order();
  if (!mirrors.length) return fail(500, 'no music mirrors configured');

  // who is asking? token is optional, nobody is turned away for not having one
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let user = null;
  if (token) { try { user = await verify(token); } catch (e) {} }
  if (!user && !fromOurSite(req)) return fail(403, 'not allowed');
  if (limited(user ? 'u:' + user.sub : 'ip:' + clientIp(req))) return fail(429, 'too many requests');

  const { p = '/', ...rest } = req.query;
  const path = String(p);
  if (!(path.startsWith('/api/') || path.startsWith('/result/')) || path.includes('..')) return fail(400, 'bad path');
  const pq = path + '?' + new URLSearchParams(rest);

  let last = null, saw404 = null;
  for (const base of mirrors) {
    const r = await ask(base, pq);
    if (r.ok) {
      badUntil.delete(base);
      lastGood = base;
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(r.text);
    }
    if (r.status === 404) saw404 = r;          // endpoint missing on this mirror, maybe another has it
    else badUntil.set(base, Date.now() + BAD_FOR);
    last = r;
  }
  const f = saw404 || last;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  return res.status(f && f.status === 404 ? 404 : 502).send(JSON.stringify({ success: false, error: 'all music mirrors failed', detail: String(f && f.text || '').slice(0, 120) }));
};
