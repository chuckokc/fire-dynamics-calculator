// Access gate logic, shared by the two Netlify Edge Functions (access.js, gate.js).
//
// Runs on Netlify Edge (Deno) and under `node --test`, so it only uses
// web-standard APIs: Web Crypto, Request/Response, URL, TextEncoder.
//
// How it works
//   * The access code lives in the ACCESS_CODE environment variable on Netlify.
//     It is never in the repo or in the files the browser downloads.
//   * Entering the right code at /access sets a signed cookie. Every other
//     request must carry a valid cookie or it gets nothing but a redirect/401.
//   * The cookie is signed with a key derived from the code, so changing
//     ACCESS_CODE invalidates every existing session at once.

export const COOKIE_NAME = 'fc_access';
export const SESSION_SECONDS = 60 * 60 * 24 * 180; // 180 days, renewed on each app load
const NO_STORE = { 'cache-control': 'no-store' };

const encoder = new TextEncoder();

// Codes are not case-sensitive (same as the old in-app screen) and ignore stray spaces.
export const normalizeCode = (value) => String(value ?? '').trim().toUpperCase();

export const isConfigured = (env) => normalizeCode(env?.ACCESS_CODE) !== '';

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

// Compare HMACs of both values so neither length nor content timing leaks.
export async function codeMatches(input, env) {
  if (!isConfigured(env)) return false;
  const [a, b] = await Promise.all([
    hmacBytes('fc-code-compare-v1', normalizeCode(input)),
    hmacBytes('fc-code-compare-v1', normalizeCode(env.ACCESS_CODE)),
  ]);
  return bytesEqual(a, b);
}

const signingSecret = (env) => `fc-session-v1|${normalizeCode(env.ACCESS_CODE)}`;

export async function createToken(env, nowMs = Date.now()) {
  const expires = Math.floor(nowMs / 1000) + SESSION_SECONDS;
  const signature = toBase64Url(await hmacBytes(signingSecret(env), `v1.${expires}`));
  return `${expires}.${signature}`;
}

export async function tokenIsValid(token, env, nowMs = Date.now()) {
  if (!isConfigured(env) || typeof token !== 'string') return false;
  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{20,64})$/.exec(token);
  if (!match) return false;
  const expires = Number(match[1]);
  if (expires * 1000 <= nowMs) return false;
  const expected = toBase64Url(await hmacBytes(signingSecret(env), `v1.${expires}`));
  return bytesEqual(encoder.encode(match[2]), encoder.encode(expected));
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
// without a valid session (code changed, session expired, or the app was
// installed before the gate existed). It wipes the cached app and sends the
// person to the login page. Without it, a cached copy would keep working
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

export function loginPage({ error = false } = {}) {
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
  hr { border:0; border-top:1px solid var(--line); margin:1.5rem 0 1rem; }
  .small { margin:.25rem 0; font-size:.9rem; color:var(--muted); }
  a { color:var(--blue); }
</style>
</head>
<body>
<main>
  <h1>Fire Dynamics Calculator</h1>
  <p class="tagline">Professional fire investigation tools based on NUREG-1805 methodology</p>
  <form method="post" action="/access">
    ${error ? '<p class="error" role="alert">That code did not work. Please check it and try again.</p>' : ''}
    <label for="code">Access code</label>
    <div class="field">
      <input id="code" name="code" type="password" required autofocus autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="200">
      <button type="button" id="toggle" aria-controls="code" aria-pressed="false">Show</button>
    </div>
    <button type="submit" class="primary">Access Calculator</button>
  </form>
  <hr>
  <p class="small">With dedication from Chuck ❤️ Christine Carpenter</p>
  <p class="small"><a href="mailto:chuckokc@gmail.com?subject=Fire%20Dynamics%20Calculator%20Feedback">Provide Feedback</a></p>
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
export async function handleGate(request, next, env) {
  const { pathname } = new URL(request.url);
  if (isPublicPath(pathname)) return next();
  if (!isConfigured(env)) return notConfiguredResponse();

  const token = readCookie(request.headers.get('cookie'), COOKIE_NAME);
  if (await tokenIsValid(token, env)) return next();

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

// Serves the login page, checks the code, and answers the app's "am I still signed in?" ping.
export async function handleAccess(request, env, { failDelayMs = 400 } = {}) {
  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  if (!isConfigured(env)) return notConfiguredResponse();

  const signedIn = await tokenIsValid(readCookie(request.headers.get('cookie'), COOKIE_NAME), env);
  const isRead = request.method === 'GET' || request.method === 'HEAD';

  if (path === '/access/status') {
    if (!isRead) return new Response('Method not allowed', { status: 405, headers: NO_STORE });
    if (!signedIn) return new Response(null, { status: 401, headers: NO_STORE });
    // Renew the session so people who use the app regularly stay signed in.
    return new Response(null, {
      status: 204,
      headers: { ...NO_STORE, 'set-cookie': sessionCookie(await createToken(env)) },
    });
  }

  if (path !== '/access') return new Response('Not found', { status: 404, headers: NO_STORE });

  if (isRead) return signedIn ? redirect('/') : htmlResponse(loginPage());

  if (request.method === 'POST') {
    let code = '';
    try {
      code = String((await request.formData()).get('code') ?? '');
    } catch {
      code = '';
    }
    if (code.length <= 200 && (await codeMatches(code, env))) {
      return redirect('/', { 'set-cookie': sessionCookie(await createToken(env)) });
    }
    // Slow down guessing a little; the edge function is also rate limited per IP.
    if (failDelayMs) await new Promise((resolve) => setTimeout(resolve, failDelayMs));
    return htmlResponse(loginPage({ error: true }), 401);
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: { allow: 'GET, HEAD, POST', ...NO_STORE },
  });
}
