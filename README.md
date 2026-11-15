# Fire Dynamics Calculator

An introductory fire dynamics calculator for fire investigators, based on
NUREG-1805 methods. Live at https://fire-dynamics-calculator.netlify.app
(deployed by Netlify from the `main` branch; Node version pinned in
`frontend/.nvmrc`).

Calculators: Heat Release Rate, Flame Height (middle of room / wall /
corner), Point Source Radiation, Flashover (MQH, Babrauskas, Thomas) and
T-Squared growth, plus a Reference Data tab.

Classroom features: a "Show the work" panel on every calculator (equations
with the numbers substituted), a lab helper that turns a measured burn into
a mass flux, "Use this HRR in…" to carry a result between calculators, a
flashover comparison for a given fire, point source distance from the
fire's edge (R = L + D/2), and a check for flames reaching the ceiling.

## Where the math lives

All equations, material tables and unit conversions are in
`frontend/src/calculations/`. The React components in
`frontend/src/components/calculators/` only handle the screen.

Deliberate simplifications (not NUREG):
- Flashover MQH uses h_k = √(kρc/t) with t = 600 s, so no wall thickness is
  needed. NUREG's spreadsheet uses h_k = k/δ.
- Heat release rate uses Q = m″·A·ΔHc with Quintiere (2016) values, without
  NUREG's small-pool correction.

## Access code

The site is protected by an access code that is checked on the server, by
two Netlify Edge Functions in `frontend/netlify/edge-functions/`. Until a
visitor enters the code, Netlify sends them only the login page. None of the
app's files are served, and the code is not in this repo or in the app.

- **The codes** are the `ACCESS_CODE` environment variable in Netlify (Project
  configuration > Environment variables). Set it for all deploy contexts
  (production and deploy previews). Do not tick "Contains secret values":
  Netlify's secret scanner fails the build if a short code word appears
  anywhere in the app or the docs. It can hold several codes separated by
  commas, and a code can end with `until YYYY-MM-DD`, after which it stops
  working at the end of that day (U.S. Central time). For example:
  `first phrase until 2027-05-14, second phrase`. Capitals and extra spaces
  do not matter; a code cannot contain a comma.
- **To change the codes**, edit `ACCESS_CODE` in Netlify, then trigger a new
  deploy (Deploys > Trigger deploy > Deploy site). Netlify reads the value
  when it builds, so the old setting keeps working until that deploy
  finishes. End dates are checked on every request, so a code stops working
  at its end date without another deploy.
- **A session belongs to the code that opened it.** When a code reaches its end
  date or is removed from the list, the people who signed in with it are
  signed out, and everyone signed in with another code carries on. Adding a
  code signs nobody out. Phones and computers with the app installed are
  cleared and asked for a code the next time they are online and open it. A
  device that stays offline keeps its cached copy until it next connects.
- **If every code has ended**, the login page says the codes have expired and
  nobody can sign in. A date that does not exist (such as 2027-02-31) causes
  that code to be left out, so after changing `ACCESS_CODE` always check the
  login on the new deploy.
- **Sessions** last 180 days and renew whenever the app is opened online.
- **If `ACCESS_CODE` is missing** the site shows "Almost ready" and serves
  nothing else (it fails closed).
- Guessing is limited to 100 requests per minute per IP address, plus a short
  delay after a wrong code. Use a phrase of two or three words rather than a
  single common word.
- `npm run dev` does not run the Edge Functions, so the local dev server is
  not gated.
- The login page has a **Don't have a code? Request one** form (name, email,
  agency/school/class, how they heard) and a **Send feedback** form; the app's
  **Provide Feedback** button opens the same kind of form. They are stored by
  Netlify Forms, which emails the site owner, so nobody needs an email app and
  the owner's address is not on the site. See "Request and feedback forms" below.
- Public on purpose: the login page, the install manifest, the icons and
  `/forms.html` (where the forms are posted by people who have no code yet).

## Request and feedback forms

Requests for a code and feedback go through Netlify Forms (free plan: about 100
submissions a month, and Netlify's spam filter plus a hidden trap field keep bots
out). To work, they need:

1. **Form detection turned on** (Netlify: Forms, then Enable form detection). It is
   on for this site.
2. **`frontend/public/forms.html`**, a hidden page that lists both forms. Netlify
   reads it at deploy time. The login page and the app post to it. If you add or
   rename a field, change it here, on the login page
   (`netlify/edge-functions/lib/access.js`) and in `src/sendForm.js` /
   `src/components/FeedbackModal.jsx`; `tests/forms.test.js` fails if they disagree.
3. **An email notification**, so you hear about each submission (Netlify: Project
   configuration, Notifications, Emails and webhooks, Form submission
   notifications; pick the form or all forms). Netlify sends these from
   `formresponses@netlify.com`, and replies go there rather than to the
   requester, so reply to the address in the request itself.

Requests and feedback are also listed under Forms in Netlify.

## Checks

`frontend/tests/calculations.test.js` compares the calculations with the
NUREG-1805 spreadsheet results (04 flame height, 05.1 heat flux,
13 flashover) and other reference values. `frontend/tests/access.test.js`
checks the access gate: signed-out visitors get nothing, a changed code
signs everyone out, and nothing opens when no code is set.

```
cd frontend
npm test          # run the checks
npm run build     # runs the checks first; the build stops if any fail
```

Netlify runs `npm run build`, so a change that breaks the math fails the
deploy and the live site stays as it was.
