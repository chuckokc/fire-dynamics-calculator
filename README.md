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

## Checks

`frontend/tests/calculations.test.js` compares the calculations with the
NUREG-1805 spreadsheet results (04 flame height, 05.1 heat flux,
13 flashover) and other reference values.

```
cd frontend
npm test          # run the checks
npm run build     # runs the checks first; the build stops if any fail
```

Netlify runs `npm run build`, so a change that breaks the math fails the
deploy and the live site stays as it was.
