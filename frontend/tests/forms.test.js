// Checks for the request-a-code and feedback forms. They are stored by Netlify
// Forms, which only knows about forms (and field names) declared in
// public/forms.html, so these tests make sure the login page, the app and that
// page all agree. They also make sure the creator's email address is not shipped.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from '../netlify/edge-functions/gate.js';
import { isPublicPath, loginPage } from '../netlify/edge-functions/lib/access.js';
import { FEEDBACK_FORM, FORMS_PATH, submitForm } from '../src/sendForm.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// ---------- the skeleton page Netlify reads ----------

const skeleton = readFileSync(join(ROOT, 'public', 'forms.html'), 'utf8');

function skeletonForms() {
  const forms = {};
  for (const match of skeleton.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)) {
    const attributes = match[1];
    const name = attributes.match(/\bname="([^"]+)"/)[1];
    forms[name] = {
      attributes,
      names: [...match[2].matchAll(/<(?:input|textarea)\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]).sort(),
      subject: match[2].match(/name="subject" value="([^"]*)"/)?.[1],
    };
  }
  return forms;
}

// The two forms on the login page, keyed by their Netlify form name.
function loginPageForms() {
  const forms = {};
  for (const match of loginPage().matchAll(/<form class="send"[^>]*>([\s\S]*?)<\/form>/g)) {
    const name = match[1].match(/name="form-name" value="([^"]+)"/)[1];
    forms[name] = {
      names: [...match[1].matchAll(/<(?:input|textarea)\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]).sort(),
      subject: match[1].match(/name="subject" value="([^"]*)"/)?.[1],
    };
  }
  return forms;
}

test('forms page: declares both forms for Netlify, with a trap field for bots', () => {
  const forms = skeletonForms();
  assert.deepEqual(Object.keys(forms).sort(), ['access-request', 'feedback']);
  for (const [name, form] of Object.entries(forms)) {
    assert.match(form.attributes, /\bdata-netlify="true"/, name);
    assert.match(form.attributes, /\bnetlify-honeypot="bot-field"/, name);
    assert.ok(form.names.includes('bot-field'), name);
    assert.ok(form.names.includes('form-name'), name);
    assert.ok(form.subject, `${name} has an email subject`);
  }
  assert.match(skeleton, /<meta name="robots" content="noindex">/);
});

test('forms: the login page sends exactly the fields the forms page declares', () => {
  const declared = skeletonForms();
  const sent = loginPageForms();
  assert.deepEqual(Object.keys(sent).sort(), Object.keys(declared).sort());
  for (const name of Object.keys(declared)) {
    assert.deepEqual(sent[name].names, declared[name].names, `${name}: field names`);
    assert.equal(sent[name].subject, declared[name].subject, `${name}: subject`);
  }
  assert.ok(loginPage().includes(`action="${FORMS_PATH}"`));
});

test('forms: the app feedback window sends exactly the fields the forms page declares', () => {
  const declared = skeletonForms()[FEEDBACK_FORM.name];
  assert.ok(declared, 'feedback form is declared');
  // FeedbackModal sends these along with the fields listed in FEEDBACK_FORM.fields.
  const sent = ['form-name', 'subject', 'bot-field', ...FEEDBACK_FORM.fields].sort();
  assert.deepEqual(sent, declared.names);
  assert.equal(FEEDBACK_FORM.subject, declared.subject);
  const modal = readFileSync(join(ROOT, 'src', 'components', 'FeedbackModal.jsx'), 'utf8');
  for (const field of ['message', 'email', 'app_version']) {
    assert.match(modal, new RegExp(`\\b${field}\\b`), `FeedbackModal sends ${field}`);
  }
  assert.match(modal, /'bot-field': botField/);
  assert.match(modal, /subject: FEEDBACK_FORM\.subject/);
});

test('forms: people with no code can reach the forms page', async () => {
  assert.equal(FORMS_PATH, '/forms.html');
  assert.equal(isPublicPath(FORMS_PATH), true);
  assert.ok(config.excludedPath.includes(FORMS_PATH), 'the gate Edge Function skips the forms page');
  // Every path the gate code treats as public is also skipped by the Edge Function config.
  for (const path of ['/access', '/access/status', '/icons/icon-192x192.png', '/favicon.ico', '/manifest.json', '/manifest.webmanifest', FORMS_PATH]) {
    const skipped = config.excludedPath.some((pattern) =>
      pattern.endsWith('/*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern
    );
    assert.equal(skipped, true, `${path} is excluded in gate.js`);
  }
});

// ---------- sending from the app ----------

test('submitForm: posts url-encoded fields and the form name to the forms page', async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200 };
  };
  const result = await submitForm('feedback', { message: 'Great tool & useful', email: '' }, fetchFn);
  assert.equal(result, 'sent');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/forms.html');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/x-www-form-urlencoded');
  const body = new URLSearchParams(calls[0].options.body);
  assert.equal(body.get('form-name'), 'feedback');
  assert.equal(body.get('message'), 'Great tool & useful', 'special characters survive encoding');
  assert.equal(body.get('email'), '');
});

test('submitForm: reports failure for a bad response or a network error, and never throws', async () => {
  assert.equal(await submitForm('feedback', {}, async () => ({ ok: false, status: 404 })), 'failed');
  assert.equal(await submitForm('feedback', {}, async () => ({ ok: false, status: 500 })), 'failed');
  assert.equal(
    await submitForm('feedback', {}, async () => {
      throw new TypeError('offline');
    }),
    'failed'
  );
});

// ---------- nothing in the shipped site shows an email address ----------

function shippedFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return shippedFiles(path);
    return /\.(js|jsx|html|css|json|svg|txt|webmanifest)$/.test(entry) ? [path] : [];
  });
}

test('privacy: no email address or mail link is shipped with the site', () => {
  const files = [
    ...shippedFiles(join(ROOT, 'src')),
    ...shippedFiles(join(ROOT, 'netlify')),
    ...shippedFiles(join(ROOT, 'public')),
    join(ROOT, 'index.html'),
  ];
  assert.ok(files.length > 20, 'found the site files');
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /mailto:/i, `${file} has a mailto: link`);
    assert.doesNotMatch(text, /[A-Za-z0-9._+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/, `${file} has an email address`);
  }
});
