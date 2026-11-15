// Access gate logic, shared by the two Netlify Edge Functions (access.js, gate.js).
//
// Runs on Netlify Edge (Deno) and under `node --test`, so it only uses
// web-standard APIs: Web Crypto, Intl, Request/Response, URL, TextEncoder.
//
// How it works
//   * The access codes live in the ACCESS_CODE environment variable on Netlify.
//     They are never in the repo or in the files the browser downloads.
//     ACCESS_CODE holds one or more codes separated by commas. A code can end
//     with "until YYYY-MM-DD" and then stops working at the end of that day
//     (U.S. Central time), for example:
//         old phrase until 2027-05-14, new phrase
//   * Entering a valid code at /access sets a signed cookie. Every other
//     request must carry a valid cookie or it gets nothing but a redirect/401.
//   * The cookie is signed with a key derived from the code that was entered,
//     so a session ends when its code reaches its end date or is removed from
//     ACCESS_CODE, while sessions from the other codes carry on.

export const COOKIE_NAME = 'fc_access';
export const SESSION_SECONDS = 60 * 60 * 24 * 180; // 180 days, renewed on each app load
const NO_STORE = { 'cache-control': 'no-store' };

const encoder = new TextEncoder();

// People who do not have a code can email the creator from the login page.
const CREATOR_EMAIL = 'chuckokc@gmail.com';
export const REQUEST_ACCESS_MAILTO =
  `mailto:${CREATOR_EMAIL}?subject=${encodeURIComponent('Fire Dynamics Calculator Access Request')}` +
  `&body=${encodeURIComponent(
    [
      'Hello Chuck,',
      '',
      'I would like the access code for the Fire Dynamics Calculator.',
      '',
      'Name:',
      'Agency / school / class:',
      'How I heard about the calculator:',
      '',
      'Thank you.',
    ].join('\r\n')
  )}`;
const FEEDBACK_MAILTO = `mailto:${CREATOR_EMAIL}?subject=${encodeURIComponent('Fire Dynamics Calculator Feedback')}`;

// Codes are not case-sensitive and ignore stray or repeated spaces.
export const normalizeCode = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();

// ---------- the configured codes ----------

// The instant a code with an "until" date stops working: midnight at the end of
// that day in U.S. Central time. Midnight Central is 05:00 or 06:00 UTC
// depending on daylight saving time, so ask the time zone database which.
// Returns null for dates that do not exist (such as 2027-02-31).
export function endOfDayCentral(dateText) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  const hourInChicago = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    hourCycle: 'h23',
  });
  for (const utcHour of [5, 6]) {
    const instant = Date.UTC(year, month - 1, day + 1, utcHour);
    if (Number(hourInChicago.format(new Date(instant))) === 0) return instant;
  }
  return null;
}

const UNTIL = /^(.*\S)\s+until\s+(\d{4}-\d{2}-\d{2})$/i;

// "old phrase until 2027-05-14, new phrase" -> [{ code, endsAt }, { code, endsAt: null }]
// A code whose date does not exist is left out rather than made open-ended.
export function parseCodes(raw) {
  const entries = [];
  for (const part of String(raw ?? '').split(',')) {
    const text = part.trim();
    if (!text) continue;
    const match = UNTIL.exec(text);
    if (!match) {
      entries.push({ code: normalizeCode(text), endsAt: null });
      continue;
    }
    const endsAt = endOfDayCentral(match[2]);
    if (endsAt !== null) entries.push({ code: normalizeCode(match[1]), endsAt });
  }
  return entries;
}

// missing: nothing usable is configured. expired: every code has passed its end
// date. ok: at least one code works right now (those are in `active`).
export function accessState(env, nowMs = Date.now()) {
  const entries = parseCodes(env?.ACCESS_CODE);
  if (entries.length === 0) return { state: 'missing', active: [] };
  const active = entries.filter((entry) => entry.endsAt === null || nowMs < entry.endsAt);
  return { state: active.length > 0 ? 'ok' : 'expired', active };
}

// ---------- codes, sessions and cookies ----------

async function hmacBytes(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

function toBase64Url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Constant-time comparison (length is not secret here).
function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Which working code (if any) did the visitor type? Compares HMACs of every
// code so neither length nor content timing leaks.
export async function matchCode(input, active) {
  const probe = await hmacBytes('fc-code-compare-v1', normalizeCode(input));
  let matched = null;
  for (const entry of active) {
    const candidate = await hmacBytes('fc-code-compare-v1', entry.code);
    if (bytesEqual(probe, candidate) && matched === null) matched = entry;
  }
  return matched;
}

const signingSecret = (entry) => `fc-session-v1|${entry.code}`;

export async function createToken(entry, nowMs = Date.now()) {
  const expires = Math.floor(nowMs / 1000) + SESSION_SECONDS;
  const signature = toBase64Url(await hmacBytes(signingSecret(entry), `v1.${expires}`));
  return `${expires}.${signature}`;
}

// Returns the code entry this session was created with, or null when the
// cookie is missing, edited, out of date, or from a code that no longer works.
export async function findSession(token, active, nowMs = Date.now()) {
  if (typeof token !== 'string') return null;
  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{20,64})$/.exec(token);
  if (!match) return null;
  const expires = Number(match[1]);
  if (expires * 1000 <= nowMs) return null;
  let found = null;
  for (const entry of active) {
    const expected = toBase64Url(await hmacBytes(signingSecret(entry), `v1.${expires}`));
    if (bytesEqual(encoder.encode(match[2]), encoder.encode(expected)) && found === null) found = entry;
  }
  return found;
}

export function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i !== -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export const sessionCookie = (token) =>
  `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`;

// Files that are safe to serve without a code: the login page itself plus the
// install manifest and icons (browsers fetch these without cookies).
export function isPublicPath(pathname) {
  return (
    pathname === '/access' ||
    pathname.startsWith('/access/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/manifest.webmanifest'
  );
}

const wantsPage = (request) =>
  request.method === 'GET' &&
  (request.headers.get('sec-fetch-dest') === 'document' ||
    (request.headers.get('accept') || '').includes('text/html'));

// What an installed copy of the app receives when it checks for an update
// without a valid session (code changed or ended, session expired, or the app
// was installed before the gate existed). It wipes the cached app and sends
// the person to the login page. Without it, a cached copy would keep working
// forever and could never update.
export const SIGN_OUT_SERVICE_WORKER = `// Access code required: remove the cached app and ask for the code.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    windows.forEach((client) => client.navigate('/access'));
  })());
});
`;

const securityHeaders = {
  ...NO_STORE,
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

const htmlResponse = (html, status = 200) =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', ...securityHeaders },
  });

const redirect = (location, extraHeaders = {}) =>
  new Response(null, { status: 303, headers: { location, ...NO_STORE, ...extraHeaders } });

function notConfiguredResponse() {
  return htmlResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fire Dynamics Calculator</title>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem">
<h1>Almost ready</h1>
<p>This site's access code has not been set up yet. The site owner needs to add the
<code>ACCESS_CODE</code> setting in Netlify.</p></body></html>`,
    503
  );
}

export function loginPage({ error = false, expired = false } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#3182CE">
<meta name="robots" content="noindex">
<title>Fire Dynamics Calculator</title>
<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png">
<style>
  :root { color-scheme: light dark; --bg:#f7fafc; --card:#fff; --text:#1a202c; --muted:#718096; --line:#e2e8f0; --blue:#3182ce; --blue-dark:#2b6cb0; --err:#c53030; }
  @media (prefers-color-scheme: dark) { :root { --bg:#171923; --card:#1a202c; --text:#edf2f7; --muted:#a0aec0; --line:#2d3748; --blue:#63b3ed; --blue-dark:#90cdf4; --err:#fc8181; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  main { max-width:28rem; margin:5rem auto 2rem; padding:2rem; background:var(--card); border-radius:.75rem; box-shadow:0 10px 25px rgba(0,0,0,.12); text-align:center; }
  @media (max-width: 30rem) { main { margin:0; min-height:100vh; border-radius:0; box-shadow:none; } }
  h1 { margin:0 0 .75rem; font-size:1.6rem; color:var(--blue); }
  .tagline { margin:0 0 1.5rem; color:var(--muted); }
  label { display:block; text-align:left; font-size:.9rem; margin-bottom:.35rem; }
  .field { display:flex; gap:.5rem; margin-bottom:1rem; }
  input { flex:1; min-width:0; padding:.7rem .8rem; font-size:1.05rem; border:1px solid var(--line); border-radius:.4rem; background:transparent; color:inherit; }
  input:focus { outline:2px solid var(--blue); outline-offset:1px; }
  button { cursor:pointer; font:inherit; border-radius:.4rem; }
  #toggle { padding:0 .8rem; border:1px solid var(--line); background:transparent; color:var(--muted); }
  .primary { width:100%; padding:.8rem; border:0; background:#3182ce; color:#fff; font-size:1.05rem; font-weight:600; }
  .primary:hover { background:var(--blue-dark); }
  .error { margin:0 0 1rem; padding:.6rem .8rem; border:1px solid var(--err); border-radius:.4rem; color:var(--err); text-align:left; }
  .notice { margin:0 0 1rem; padding:.6rem .8rem; border:1px solid var(--line); border-radius:.4rem; color:var(--muted); text-align:left; }
  hr { border:0; border-top:1px solid var(--line); margin:1.5rem 0 1rem; }
  .request { margin:1rem 0 0; font-size:.95rem; }
  .small { margin:.25rem 0; font-size:.9rem; color:var(--muted); }
  a { color:var(--blue); }
</style>
</head>
<body>
<main>
  <h1>Fire Dynamics Calculator</h1>
  <p class="tagline">Professional fire investigation tools based on NUREG-1805 methodology</p>
  <form method="post" action="/access">
    ${expired ? '<p class="notice" role="alert">The access codes for this site have expired. Please request a new one below.</p>' : ''}
    ${error ? '<p class="error" role="alert">That code did not work. Please check it and try again.</p>' : ''}
    <label for="code">Access code</label>
    <div class="field">
      <input id="code" name="code" type="password" required autofocus autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="200">
      <button type="button" id="toggle" aria-controls="code" aria-pressed="false">Show</button>
    </div>
    <button type="submit" class="primary">Access Calculator</button>
  </form>
  <p class="request">Don't have a code? <a href="${REQUEST_ACCESS_MAILTO.replace(/&/g, '&amp;')}">Email Chuck to request one</a>, or write to ${CREATOR_EMAIL}</p>
  <hr>
  <p class="small">With dedication from Chuck ❤️ Christine Carpenter</p>
  <p class="small"><a href="${FEEDBACK_MAILTO}">Provide Feedback</a></p>
</main>
<script>
  var code = document.getElementById('code');
  var toggle = document.getElementById('toggle');
  toggle.addEventListener('click', function () {
    var show = code.type === 'password';
    code.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(show));
  });
</script>
</body>
</html>`;
}

// Runs in front of the whole site (everything except the public paths).
export async function handleGate(request, next, env, nowMs = Date.now()) {
  const { pathname } = new URL(request.url);
  if (isPublicPath(pathname)) return next();
  const { state, active } = accessState(env, nowMs);
  if (state === 'missing') return notConfiguredResponse();

  const token = readCookie(request.headers.get('cookie'), COOKIE_NAME);
  if (await findSession(token, active, nowMs)) return next();

  if (pathname === '/sw.js') {
    return new Response(SIGN_OUT_SERVICE_WORKER, {
      status: 200,
      headers: { 'content-type': 'text/javascript; charset=utf-8', ...NO_STORE },
    });
  }
  if (wantsPage(request)) return redirect('/access');
  return new Response('Access code required.', {
    status: 401,
    headers: { 'content-type': 'text/plain; charset=utf-8', ...NO_STORE },
  });
}

// Serves the login page, checks the code, and answers the app's "still signed in?" ping.
export async function handleAccess(request, env, { failDelayMs = 400, nowMs = Date.now() } = {}) {
  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  const { state, active } = accessState(env, nowMs);
  if (state === 'missing') return notConfiguredResponse();

  const session = await findSession(readCookie(request.headers.get('cookie'), COOKIE_NAME), active, nowMs);
  const isRead = request.method === 'GET' || request.method === 'HEAD';
  const expired = state === 'expired';

  if (path === '/access/status') {
    if (!isRead) return new Response('Method not allowed', { status: 405, headers: NO_STORE });
    if (!session) return new Response(null, { status: 401, headers: NO_STORE });
    // Renew the session so people who use the app regularly stay signed in.
    return new Response(null, {
      status: 204,
      headers: { ...NO_STORE, 'set-cookie': sessionCookie(await createToken(session, nowMs)) },
    });
  }

  if (path !== '/access') return new Response('Not found', { status: 404, headers: NO_STORE });

  if (isRead) return session ? redirect('/') : htmlResponse(loginPage({ expired }));

  if (request.method === 'POST') {
    let code = '';
    try {
      code = String((await request.formData()).get('code') ?? '');
    } catch {
      code = '';
    }
    const matched = code.length <= 200 ? await matchCode(code, active) : null;
    if (matched) {
      return redirect('/', { 'set-cookie': sessionCookie(await createToken(matched, nowMs)) });
    }
    // Slow down guessing a little; the edge function is also rate limited per IP.
    if (failDelayMs) await new Promise((resolve) => setTimeout(resolve, failDelayMs));
    return htmlResponse(loginPage({ error: !expired, expired }), 401);
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: { allow: 'GET, HEAD, POST', ...NO_STORE },
  });
}
