// Checks for the server-side access gate (netlify/edge-functions/lib/access.js)
// and the app's sign-in check. These run before every build, so a mistake in
// the gate stops the deploy instead of locking people out (or letting them in).
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COOKIE_NAME,
  SESSION_SECONDS,
  SIGN_OUT_SERVICE_WORKER,
  codeMatches,
  createToken,
  handleAccess,
  handleGate,
  isConfigured,
  isPublicPath,
  REQUEST_ACCESS_MAILTO,
  loginPage,
  normalizeCode,
  readCookie,
  tokenIsValid,
} from '../netlify/edge-functions/lib/access.js';
import { checkAccess } from '../src/accessCheck.js';

const ENV = { ACCESS_CODE: 'test-phrase-one' };
const OTHER_ENV = { ACCESS_CODE: 'a-different-phrase' };
const ORIGIN = 'https://example.netlify.app';
const NO_DELAY = { failDelayMs: 0 };

const get = (path, headers = {}) => new Request(ORIGIN + path, { headers });
const page = (path, headers = {}) => get(path, { accept: 'text/html', ...headers });
const post = (path, body, headers = {}) =>
  new Request(ORIGIN + path, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body,
  });
const cookieFor = async (env = ENV) => `${COOKIE_NAME}=${await createToken(env)}`;

// A stand-in for the real site: records whether the gate ever let a request through.
const makeNext = () => {
  const next = async () => {
    next.calls += 1;
    return new Response('APP FILES', { status: 200 });
  };
  next.calls = 0;
  return next;
};

// ---------- code and cookie basics ----------

test('codes ignore case and surrounding spaces; empty/missing never matches', async () => {
  assert.equal(normalizeCode('  Test-Phrase-One '), 'TEST-PHRASE-ONE');
  assert.equal(await codeMatches('TEST-PHRASE-ONE', ENV), true);
  assert.equal(await codeMatches(' test-phrase-one ', ENV), true);
  assert.equal(await codeMatches('test-phrase-two', ENV), false);
  assert.equal(await codeMatches('', ENV), false);
  assert.equal(await codeMatches('', {}), false);
  assert.equal(await codeMatches('anything', {}), false);
  assert.equal(isConfigured({}), false);
  assert.equal(isConfigured({ ACCESS_CODE: '   ' }), false);
});

test('a session token is valid until it expires, and not after', async () => {
  const now = Date.now();
  const token = await createToken(ENV, now);
  assert.equal(await tokenIsValid(token, ENV, now), true);
  assert.equal(await tokenIsValid(token, ENV, now + (SESSION_SECONDS - 5) * 1000), true);
  assert.equal(await tokenIsValid(token, ENV, now + (SESSION_SECONDS + 5) * 1000), false);
});

test('tokens cannot be forged, edited, or reused after the code changes', async () => {
  const now = Date.now();
  const token = await createToken(ENV, now);
  const [expires, signature] = token.split('.');
  assert.equal(await tokenIsValid(token, OTHER_ENV, now), false, 'old code must not work after rotation');
  assert.equal(await tokenIsValid(`${Number(expires) + 99999}.${signature}`, ENV, now), false, 'extended expiry');
  assert.equal(await tokenIsValid(`${expires}.${signature.slice(0, -1)}A`, ENV, now), false, 'edited signature');
  for (const junk of [undefined, null, '', 'granted', '1.2', 'abc.def', `${expires}.`]) {
    assert.equal(await tokenIsValid(junk, ENV, now), false, `junk: ${junk}`);
  }
  assert.equal(await tokenIsValid(token, {}, now), false, 'nothing is valid when no code is configured');
});

test('readCookie finds the right cookie among several', () => {
  assert.equal(readCookie('a=1; fc_access=abc.def; b=2', 'fc_access'), 'abc.def');
  assert.equal(readCookie('a=1', 'fc_access'), null);
  assert.equal(readCookie(null, 'fc_access'), null);
});

test('only the login page, install manifest and icons are public', () => {
  for (const p of ['/access', '/access/', '/access/status', '/icons/icon-192x192.png', '/favicon.ico', '/manifest.json', '/manifest.webmanifest']) {
    assert.equal(isPublicPath(p), true, p);
  }
  for (const p of ['/', '/index.html', '/sw.js', '/assets/index-abc.js', '/assets/index-abc.js.map', '/accessory', '/iconsx/a.png', '/workbox-1.js']) {
    assert.equal(isPublicPath(p), false, p);
  }
  // Dot-segment tricks are resolved by the URL parser before we ever see the path.
  assert.equal(isPublicPath(new URL('/icons/../assets/app.js', ORIGIN).pathname), false);
  assert.equal(isPublicPath(new URL('/icons/%2e%2e/assets/app.js', ORIGIN).pathname), false);
});

// ---------- the gate in front of the site ----------

test('gate: without a cookie nothing is served, and the app files are never fetched', async () => {
  const next = makeNext();

  const doc = await handleGate(page('/'), next, ENV);
  assert.equal(doc.status, 303);
  assert.equal(doc.headers.get('location'), '/access');

  for (const path of ['/assets/index-abc.js', '/assets/index-abc.js.map', '/workbox-74df0113.js', '/index.html']) {
    const res = await handleGate(get(path, { accept: '*/*' }), next, ENV);
    assert.equal(res.status, 401, path);
    assert.doesNotMatch(await res.text(), /APP FILES/);
  }
  assert.equal(next.calls, 0, 'the site must not be touched for signed-out visitors');
});

test('gate: a valid cookie lets everything through', async () => {
  const next = makeNext();
  const cookie = await cookieFor();
  for (const path of ['/', '/index.html', '/assets/index-abc.js', '/sw.js']) {
    const res = await handleGate(get(path, { cookie }), next, ENV);
    assert.equal(res.status, 200, path);
    assert.equal(await res.text(), 'APP FILES');
  }
});

test('gate: cookie from before a code change, or an expired one, is rejected', async () => {
  const next = makeNext();
  const oldCookie = await cookieFor(OTHER_ENV);
  assert.equal((await handleGate(page('/', { cookie: oldCookie }), next, ENV)).status, 303);

  const expired = `${COOKIE_NAME}=${await createToken(ENV, Date.now() - (SESSION_SECONDS + 60) * 1000)}`;
  assert.equal((await handleGate(page('/', { cookie: expired }), next, ENV)).status, 303);
  assert.equal(next.calls, 0);
});

test('gate: with no ACCESS_CODE set it fails closed, not open', async () => {
  const next = makeNext();
  const res = await handleGate(page('/'), next, {});
  assert.equal(res.status, 503);
  assert.equal(next.calls, 0);
  const withCookie = await handleGate(get('/', { cookie: await cookieFor() }), next, {});
  assert.equal(withCookie.status, 503);
});

test('gate: signed-out installed apps get a self-removing service worker instead of the real one', async () => {
  const next = makeNext();
  const res = await handleGate(get('/sw.js', { 'sec-fetch-dest': 'serviceworker', accept: '*/*' }), next, ENV);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const body = await res.text();
  assert.equal(body, SIGN_OUT_SERVICE_WORKER);
  assert.match(body, /caches\.delete/);
  assert.match(body, /unregister\(\)/);
  assert.match(body, /navigate\('\/access'\)/);
  assert.equal(next.calls, 0);
});

test('gate: public paths pass straight through', async () => {
  const next = makeNext();
  for (const path of ['/icons/icon-192x192.png', '/manifest.json', '/favicon.ico']) {
    assert.equal((await handleGate(get(path), next, ENV)).status, 200, path);
  }
});

// ---------- the login page ----------

test('login page: shows the form, never the code, and is not cached', async () => {
  const res = await handleAccess(get('/access'), ENV, NO_DELAY);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  const html = await res.text();
  assert.match(html, /name="code"/);
  assert.match(html, /Access Calculator/);
  assert.match(html, /Provide Feedback/);
  assert.equal(html.toLowerCase().includes(ENV.ACCESS_CODE), false);
  assert.doesNotMatch(html, /role="alert"/);
  assert.match(loginPage({ error: true }), /role="alert"/);
});

test('login page: offers an email to the creator to request the code', async () => {
  // The link itself: right address, subject, and a body with room for name/agency.
  const url = new URL(REQUEST_ACCESS_MAILTO);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'chuckokc@gmail.com');
  assert.equal(url.searchParams.get('subject'), 'Fire Dynamics Calculator Access Request');
  const body = url.searchParams.get('body');
  assert.match(body, /access code/i);
  assert.match(body, /Name:/);
  assert.match(body, /Agency \/ school \/ class:/);
  assert.ok(body.includes('\r\n'), 'body should have line breaks');
  assert.equal(body.toLowerCase().includes(ENV.ACCESS_CODE), false);

  // On the page, as a clickable link (the & between subject and body is escaped for HTML).
  for (const html of [loginPage(), loginPage({ error: true })]) {
    assert.match(html, /Don't have a code\? <a href="mailto:chuckokc@gmail\.com\?subject=Fire%20Dynamics%20Calculator%20Access%20Request&amp;body=/);
    assert.match(html, />Email Chuck to request one<\/a>, or write to chuckokc@gmail\.com<\/p>/, 'address is also shown as plain text for people without an email app');
    assert.match(html, /Provide Feedback/);
  }
});

test('login: the right code signs you in with a safe cookie and sends you to the app', async () => {
  const res = await handleAccess(post('/access', 'code=Test-Phrase-One'), ENV, NO_DELAY);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/');
  const setCookie = res.headers.get('set-cookie');
  assert.match(setCookie, new RegExp(`^${COOKIE_NAME}=\\d+\\.[A-Za-z0-9_-]+;`));
  for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', `Max-Age=${SESSION_SECONDS}`]) {
    assert.ok(setCookie.includes(attribute), `cookie should include ${attribute}`);
  }
  // The cookie we were just given really does open the gate.
  const next = makeNext();
  const cookie = setCookie.split(';')[0];
  assert.equal((await handleGate(get('/assets/index-abc.js', { cookie }), next, ENV)).status, 200);
});

test('login: wrong, empty, or missing codes are refused and set no cookie', async () => {
  for (const body of ['code=nope', 'code=', 'code=%20%20', 'other=1', '']) {
    const res = await handleAccess(post('/access', body), ENV, NO_DELAY);
    assert.equal(res.status, 401, `body: "${body}"`);
    assert.equal(res.headers.get('set-cookie'), null);
    assert.match(await res.text(), /role="alert"/);
  }
  // Not a form at all
  const res = await handleAccess(
    new Request(`${ORIGIN}/access`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"code":"test-phrase-one"}' }),
    ENV,
    NO_DELAY
  );
  assert.equal(res.status, 401);
  // Absurdly long input is refused outright
  assert.equal((await handleAccess(post('/access', `code=${'a'.repeat(5000)}`), ENV, NO_DELAY)).status, 401);
});

test('login: nothing can be entered when no ACCESS_CODE is configured', async () => {
  assert.equal((await handleAccess(post('/access', 'code='), {}, NO_DELAY)).status, 503);
  assert.equal((await handleAccess(post('/access', 'code=anything'), {}, NO_DELAY)).status, 503);
  assert.equal((await handleAccess(get('/access'), {}, NO_DELAY)).status, 503);
});

test('login: someone already signed in is sent on to the app', async () => {
  const res = await handleAccess(get('/access', { cookie: await cookieFor() }), ENV, NO_DELAY);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/');
});

test('login: other methods and paths are refused', async () => {
  assert.equal((await handleAccess(new Request(`${ORIGIN}/access`, { method: 'DELETE' }), ENV, NO_DELAY)).status, 405);
  assert.equal((await handleAccess(get('/access/other'), ENV, NO_DELAY)).status, 404);
});

test('login: a wrong code waits a moment before answering', async () => {
  const started = Date.now();
  await handleAccess(post('/access', 'code=nope'), ENV, { failDelayMs: 120 });
  assert.ok(Date.now() - started >= 100);
});

// ---------- the app's "still signed in?" ping ----------

test('status: signed-in devices get 204 and a renewed cookie; others get 401', async () => {
  const ok = await handleAccess(get('/access/status', { cookie: await cookieFor() }), ENV, NO_DELAY);
  assert.equal(ok.status, 204);
  assert.match(ok.headers.get('set-cookie'), new RegExp(`^${COOKIE_NAME}=`));
  assert.equal(ok.headers.get('cache-control'), 'no-store');

  const none = await handleAccess(get('/access/status'), ENV, NO_DELAY);
  assert.equal(none.status, 401);
  assert.equal(none.headers.get('set-cookie'), null);

  const rotated = await handleAccess(get('/access/status', { cookie: await cookieFor(OTHER_ENV) }), ENV, NO_DELAY);
  assert.equal(rotated.status, 401);
});

test('app check: only a clear 401 sends anyone to the login page', async () => {
  const visits = [];
  const run = (impl) => checkAccess({ fetchFn: impl, goToLogin: () => visits.push('login') });

  assert.equal(await run(async () => new Response(null, { status: 204 })), 'signed-in');
  assert.equal(await run(async () => new Response('x', { status: 200 })), 'signed-in');
  assert.equal(await run(async () => new Response(null, { status: 503 })), 'unknown');
  assert.equal(await run(async () => new Response(null, { status: 500 })), 'unknown');
  assert.equal(await run(async () => { throw new TypeError('offline'); }), 'offline');
  assert.deepEqual(visits, [], 'offline, server trouble, or a good session never redirect');

  assert.equal(await run(async () => new Response(null, { status: 401 })), 'signed-out');
  assert.deepEqual(visits, ['login']);
});
