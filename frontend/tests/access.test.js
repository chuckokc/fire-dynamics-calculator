// Checks for the server-side access gate (netlify/edge-functions/lib/access.js)
// and the app's sign-in check. These run before every build, so a mistake in
// the gate stops the deploy instead of locking people out (or letting them in).
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COOKIE_NAME,
  SESSION_SECONDS,
  SIGN_OUT_SERVICE_WORKER,
  accessState,
  createToken,
  endOfDayCentral,
  findSession,
  handleAccess,
  handleGate,
  isPublicPath,
  loginPage,
  matchCode,
  normalizeCode,
  parseCodes,
  readCookie,
} from '../netlify/edge-functions/lib/access.js';
import { checkAccess } from '../src/accessCheck.js';

const ENV = { ACCESS_CODE: 'test-phrase-one' };
const OTHER_ENV = { ACCESS_CODE: 'a-different-phrase' };
// Two codes: the first stops working at the end of 2027-05-14 (Central time).
const MULTI = { ACCESS_CODE: 'Old Phrase until 2027-05-14, new-phrase' };
const ORIGIN = 'https://example.netlify.app';
const NO_DELAY = { failDelayMs: 0 };
const iso = (ms) => new Date(ms).toISOString();

const get = (path, headers = {}) => new Request(ORIGIN + path, { headers });
const page = (path, headers = {}) => get(path, { accept: 'text/html', ...headers });
const post = (path, body, headers = {}) =>
  new Request(ORIGIN + path, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body,
  });

const activeFor = (env, now = Date.now()) => accessState(env, now).active;
const tokenFor = (env, now = Date.now(), which = 0) => createToken(activeFor(env, now)[which], now);
const cookieFor = async (env = ENV, now = Date.now(), which = 0) =>
  `${COOKIE_NAME}=${await tokenFor(env, now, which)}`;

// A stand-in for the real site: records whether the gate ever let a request through.
const makeNext = () => {
  const next = async () => {
    next.calls += 1;
    return new Response('APP FILES', { status: 200 });
  };
  next.calls = 0;
  return next;
};

// ---------- codes: how ACCESS_CODE is read ----------

test('codes ignore case and extra spaces', () => {
  assert.equal(normalizeCode('  Test-Phrase-One '), 'TEST-PHRASE-ONE');
  assert.equal(normalizeCode('thermal   inertia  600'), 'THERMAL INERTIA 600');
  assert.equal(normalizeCode(undefined), '');
});

test('ACCESS_CODE can hold several codes, each with an optional end date', () => {
  assert.deepEqual(parseCodes('one'), [{ code: 'ONE', endsAt: null }]);
  assert.deepEqual(parseCodes(' One Two ,  three  '), [
    { code: 'ONE TWO', endsAt: null },
    { code: 'THREE', endsAt: null },
  ]);
  const [old, fresh] = parseCodes('Old Phrase until 2027-05-14, new-phrase');
  assert.equal(old.code, 'OLD PHRASE');
  assert.equal(old.endsAt, endOfDayCentral('2027-05-14'));
  assert.deepEqual(fresh, { code: 'NEW-PHRASE', endsAt: null });
  assert.equal(parseCodes('x UNTIL 2027-05-14')[0].code, 'X', '"until" is not case-sensitive');
  for (const empty of ['', ' , ,', undefined, null]) assert.deepEqual(parseCodes(empty), []);
});

test('a date that does not exist never makes a code open-ended', () => {
  assert.deepEqual(parseCodes('old until 2027-02-31'), [], 'no February 31st');
  assert.deepEqual(parseCodes('old until 2027-13-01'), []);
  // A mistyped date (no leading zero) turns the whole text into a code nobody will type.
  assert.ok(parseCodes('old until 2027-5-14').every((entry) => entry.code !== 'OLD'));
});

test('"until" dates end at midnight Central time, daylight saving included', () => {
  assert.equal(iso(endOfDayCentral('2027-01-15')), '2027-01-16T06:00:00.000Z', 'winter: UTC-6');
  assert.equal(iso(endOfDayCentral('2027-05-14')), '2027-05-15T05:00:00.000Z', 'summer: UTC-5');
  // Clocks spring forward 2027-03-14 and fall back 2027-11-07.
  assert.equal(iso(endOfDayCentral('2027-03-13')), '2027-03-14T06:00:00.000Z');
  assert.equal(iso(endOfDayCentral('2027-03-14')), '2027-03-15T05:00:00.000Z');
  assert.equal(iso(endOfDayCentral('2027-11-06')), '2027-11-07T05:00:00.000Z');
  assert.equal(iso(endOfDayCentral('2027-11-07')), '2027-11-08T06:00:00.000Z');
  assert.equal(endOfDayCentral('2027-02-31'), null);
  assert.equal(endOfDayCentral('nonsense'), null);
});

test('a code works through the whole last day, in Central time', () => {
  const env = { ACCESS_CODE: 'old until 2026-11-14' };
  // 6:06 pm Central on the 14th is already the 15th in UTC; the code must still work.
  assert.equal(accessState(env, Date.parse('2026-11-14T18:06:00-06:00')).state, 'ok');
  assert.equal(accessState(env, Date.parse('2026-11-14T23:59:59-06:00')).state, 'ok');
  assert.equal(accessState(env, Date.parse('2026-11-15T00:00:00-06:00')).state, 'expired');
});

test('state: missing when nothing is set, expired when every code has ended', () => {
  const now = Date.parse('2027-05-20T12:00:00Z');
  assert.equal(accessState({}, now).state, 'missing');
  assert.equal(accessState({ ACCESS_CODE: '   ' }, now).state, 'missing');
  assert.equal(accessState({ ACCESS_CODE: 'old until 2027-05-14' }, now).state, 'expired');
  const both = accessState(MULTI, now);
  assert.equal(both.state, 'ok');
  assert.deepEqual(both.active.map((entry) => entry.code), ['NEW-PHRASE']);
  assert.equal(accessState(MULTI, Date.parse('2027-05-01T12:00:00Z')).active.length, 2);
});

test('typing a code: any working code opens the door, ended or unknown ones do not', async () => {
  const before = Date.parse('2027-05-01T12:00:00Z');
  const after = Date.parse('2027-05-20T12:00:00Z');
  assert.equal((await matchCode(' OLD   phrase ', activeFor(MULTI, before))).code, 'OLD PHRASE');
  assert.equal((await matchCode('New-Phrase', activeFor(MULTI, before))).code, 'NEW-PHRASE');
  assert.equal(await matchCode('old phrase', activeFor(MULTI, after)), null, 'ended code is refused');
  assert.equal((await matchCode('new-phrase', activeFor(MULTI, after))).code, 'NEW-PHRASE');
  for (const wrong of ['', '   ', 'nope', 'old']) assert.equal(await matchCode(wrong, activeFor(MULTI, before)), null);
  assert.equal(await matchCode('anything', []), null, 'nothing matches when nothing is configured');
});

// ---------- sessions and cookies ----------

test('a session token is valid until it expires, and not after', async () => {
  const now = Date.now();
  const active = activeFor(ENV, now);
  const token = await createToken(active[0], now);
  assert.ok(await findSession(token, active, now));
  assert.ok(await findSession(token, active, now + (SESSION_SECONDS - 5) * 1000));
  assert.equal(await findSession(token, active, now + (SESSION_SECONDS + 5) * 1000), null);
});

test('tokens cannot be forged, edited, or reused after the code changes', async () => {
  const now = Date.now();
  const active = activeFor(ENV, now);
  const token = await createToken(active[0], now);
  const [expires, signature] = token.split('.');
  assert.equal(await findSession(token, activeFor(OTHER_ENV, now), now), null, 'old code must not work after rotation');
  assert.equal(await findSession(`${Number(expires) + 99999}.${signature}`, active, now), null, 'extended expiry');
  const lastChar = signature.slice(-1);
  const edited = `${signature.slice(0, -1)}${lastChar === 'A' ? 'B' : 'A'}`; // always a real change
  assert.equal(await findSession(`${expires}.${edited}`, active, now), null, 'edited signature');
  for (const junk of [undefined, null, '', 'granted', '1.2', 'abc.def', `${expires}.`]) {
    assert.equal(await findSession(junk, active, now), null, `junk: ${junk}`);
  }
  assert.equal(await findSession(token, [], now), null, 'nothing is valid when no code is configured');
});

test('a session ends with its own code and leaves the other code\'s sessions alone', async () => {
  const start = Date.parse('2027-05-01T12:00:00Z');
  const after = Date.parse('2027-05-20T12:00:00Z');
  const oldToken = await tokenFor(MULTI, start, 0); // signed in with the code that ends
  const newToken = await tokenFor(MULTI, start, 1);
  assert.ok(await findSession(oldToken, activeFor(MULTI, start), start));
  assert.equal(await findSession(oldToken, activeFor(MULTI, after), after), null, 'ended with its code');
  assert.ok(await findSession(newToken, activeFor(MULTI, after), after), 'other code carries on');
  // Removing a code from ACCESS_CODE ends its sessions too.
  const removed = { ACCESS_CODE: 'new-phrase' };
  assert.equal(await findSession(oldToken, activeFor(removed, start), start), null);
});

test('adding a second code does not sign anyone out', async () => {
  const now = Date.parse('2026-11-14T18:06:00-06:00');
  const before = await createToken(activeFor({ ACCESS_CODE: 'QUINTIERE' }, now)[0], now);
  const extended = { ACCESS_CODE: 'QUINTIERE until 2027-05-14, brand new phrase' };
  assert.ok(await findSession(before, activeFor(extended, now), now));
});

test('readCookie finds the right cookie among several', () => {
  assert.equal(readCookie('a=1; fc_access=abc.def; b=2', 'fc_access'), 'abc.def');
  assert.equal(readCookie('a=1', 'fc_access'), null);
  assert.equal(readCookie(null, 'fc_access'), null);
});

test('only the login page, install manifest, icons and forms page are public', () => {
  for (const p of ['/access', '/access/', '/access/status', '/icons/icon-192x192.png', '/favicon.ico', '/manifest.json', '/manifest.webmanifest', '/forms.html']) {
    assert.equal(isPublicPath(p), true, p);
  }
  for (const p of ['/', '/index.html', '/sw.js', '/assets/index-abc.js', '/assets/index-abc.js.map', '/accessory', '/iconsx/a.png', '/workbox-1.js', '/forms', '/forms.htm', '/forms.html/extra', '/xforms.html']) {
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

  const expired = await cookieFor(ENV, Date.now() - (SESSION_SECONDS + 60) * 1000);
  assert.equal((await handleGate(page('/', { cookie: expired }), next, ENV)).status, 303);
  assert.equal(next.calls, 0);
});

test('gate: when a code ends, its sessions are turned away but the other code\'s are not', async () => {
  const start = Date.parse('2027-05-01T12:00:00Z');
  const after = Date.parse('2027-05-20T12:00:00Z');
  const oldCookie = await cookieFor(MULTI, start, 0);
  const newCookie = await cookieFor(MULTI, start, 1);
  const next = makeNext();
  assert.equal((await handleGate(page('/', { cookie: oldCookie }), next, MULTI, start)).status, 200);
  assert.equal((await handleGate(page('/', { cookie: oldCookie }), next, MULTI, after)).status, 303);
  assert.equal((await handleGate(page('/', { cookie: newCookie }), next, MULTI, after)).status, 200);
});

test('gate: when every code has ended, the site stays closed (it does not open up)', async () => {
  const env = { ACCESS_CODE: 'old until 2027-05-14' };
  const start = Date.parse('2027-05-01T12:00:00Z');
  const after = Date.parse('2027-05-20T12:00:00Z');
  const cookie = await cookieFor(env, start);
  const next = makeNext();
  assert.equal((await handleGate(page('/', { cookie }), next, env, after)).status, 303);
  assert.equal((await handleGate(get('/assets/a.js', { cookie }), next, env, after)).status, 401);
  assert.equal(next.calls, 0);
  // Installed copies are told to clear out, same as any signed-out device.
  const sw = await handleGate(get('/sw.js', { cookie }), next, env, after);
  assert.equal(await sw.text(), SIGN_OUT_SERVICE_WORKER);
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
  for (const path of ['/icons/icon-192x192.png', '/manifest.json', '/favicon.ico', '/forms.html']) {
    assert.equal((await handleGate(get(path), next, ENV)).status, 200, path);
  }
  // People with no code yet post the request and feedback forms to /forms.html.
  assert.equal((await handleGate(post('/forms.html', 'form-name=access-request&name=A'), next, ENV)).status, 200);
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
  assert.match(html, /Send feedback/);
  assert.equal(html.toLowerCase().includes(ENV.ACCESS_CODE), false);
  assert.doesNotMatch(html, /role="alert"/);
  assert.match(loginPage({ error: true }), /role="alert"/);
});

test('login page: request-a-code and feedback forms, with no email address or mail link', async () => {
  for (const html of [loginPage(), loginPage({ error: true }), loginPage({ expired: true })]) {
    const forms = [...html.matchAll(/<form class="send"[^>]*>[\s\S]*?<\/form>/g)].map((m) => m[0]);
    assert.equal(forms.length, 2, 'a request form and a feedback form');
    const [request, feedback] = forms;

    // Both post to the public forms page, name their Netlify form, and carry a trap field for bots.
    for (const form of forms) {
      assert.match(form, /method="post" action="\/forms\.html"/);
      assert.match(form, /name="bot-field"/);
      assert.match(form, /type="hidden" name="subject"/);
      assert.match(form, /data-sent="/);
    }
    assert.match(request, /<input type="hidden" name="form-name" value="access-request">/);
    assert.match(feedback, /<input type="hidden" name="form-name" value="feedback">/);

    // The request asks who they are and where to send the code.
    assert.match(request, /name="name" required/);
    assert.match(request, /name="email" type="email" required/);
    assert.match(request, /name="organization" required/);
    assert.match(request, /name="heard_from"/);
    assert.match(request, /Send request/);
    // Feedback: a message (required) and an optional email for a reply.
    assert.match(feedback, /<textarea id="fb-message" name="message" required/);
    assert.doesNotMatch(feedback, /name="email" type="email" required/);

    // The creator's address is nowhere on the page, and there are no email links.
    assert.doesNotMatch(html, /mailto:/i);
    assert.doesNotMatch(html, /[A-Za-z0-9._+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/);
    assert.equal(html.toLowerCase().includes(ENV.ACCESS_CODE), false);

    // Forms are sent in the background and report success or failure.
    assert.match(html, /fetch\(form\.getAttribute\('action'\)/);
    assert.match(html, /application\/x-www-form-urlencoded/);
    assert.match(html, /Sorry, that did not send/);
  }
  // The request form is open by default when the codes have expired, closed otherwise.
  assert.match(loginPage({ expired: true }), /<details class="panel" open>/);
  assert.doesNotMatch(loginPage(), /<details class="panel" open>/);
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

test('login: either of two codes works, and the ended one stops after its date', async () => {
  const start = Date.parse('2027-05-01T12:00:00Z');
  const after = Date.parse('2027-05-20T12:00:00Z');
  const next = makeNext();
  for (const code of ['old phrase', 'NEW-PHRASE']) {
    const res = await handleAccess(post('/access', `code=${encodeURIComponent(code)}`), MULTI, { ...NO_DELAY, nowMs: start });
    assert.equal(res.status, 303, code);
    const cookie = res.headers.get('set-cookie').split(';')[0];
    assert.equal((await handleGate(get('/assets/a.js', { cookie }), next, MULTI, start)).status, 200, code);
  }
  const ended = await handleAccess(post('/access', 'code=old%20phrase'), MULTI, { ...NO_DELAY, nowMs: after });
  assert.equal(ended.status, 401);
  assert.equal(ended.headers.get('set-cookie'), null);
  const fresh = await handleAccess(post('/access', 'code=new-phrase'), MULTI, { ...NO_DELAY, nowMs: after });
  assert.equal(fresh.status, 303);
});

test('login: when every code has ended, the page says so and nothing signs in', async () => {
  const env = { ACCESS_CODE: 'old until 2027-05-14' };
  const after = Date.parse('2027-05-20T12:00:00Z');
  const shown = await handleAccess(get('/access'), env, { ...NO_DELAY, nowMs: after });
  assert.equal(shown.status, 200);
  assert.match(await shown.text(), /access codes for this site have expired/);
  const tried = await handleAccess(post('/access', 'code=old'), env, { ...NO_DELAY, nowMs: after });
  assert.equal(tried.status, 401);
  assert.equal(tried.headers.get('set-cookie'), null);
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

test('status: the renewed cookie keeps the same code, so it ends with that code', async () => {
  const start = Date.parse('2027-05-01T12:00:00Z');
  const after = Date.parse('2027-05-20T12:00:00Z');
  const res = await handleAccess(get('/access/status', { cookie: await cookieFor(MULTI, start, 0) }), MULTI, { ...NO_DELAY, nowMs: start });
  assert.equal(res.status, 204);
  const renewed = res.headers.get('set-cookie').split(';')[0];
  assert.equal((await handleAccess(get('/access/status', { cookie: renewed }), MULTI, { ...NO_DELAY, nowMs: start })).status, 204);
  assert.equal((await handleAccess(get('/access/status', { cookie: renewed }), MULTI, { ...NO_DELAY, nowMs: after })).status, 401);
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
