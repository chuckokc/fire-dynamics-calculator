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

- **The code** is the `ACCESS_CODE` environment variable in Netlify (Project
  configuration > Environment variables). Set it for all deploy contexts
  (production and deploy previews). Do not tick "Contains secret values":
  Netlify's secret scanner fails the build if a short code word appears
  anywhere in the app or the docs. Codes are not case-sensitive.
- **To change the code**, edit `ACCESS_CODE` in Netlify, then trigger a new
  deploy (Deploys > Trigger deploy > Deploy site). Netlify reads the value
  when it builds, so the old code keeps working until that deploy finishes.
  After that everyone is signed out. Phones and computers that have the app
  installed are cleared and asked for the new code the next time they are
  online and open it. A device that stays offline keeps its cached copy until
  it next connects.
- **Sessions** last 180 days and renew whenever the app is opened online.
- **If `ACCESS_CODE` is missing** the site shows "Almost ready" and serves
  nothing else (it fails closed).
- Guessing is limited to 100 requests per minute per IP address, plus a short
  delay after a wrong code. Use a phrase of two or three words rather than a
  single common word.
- `npm run dev` does not run the Edge Functions, so the local dev server is
  not gated.
- Public on purpose: the login page, the install manifest and the icons.

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
