# Fire Dynamics Calculator

Professional fire investigation tools based on the NUREG-1805 methodology. The app is a
progressive web app (PWA): it runs in any browser, can be installed on a phone's home
screen, and keeps working offline once loaded. All calculations run on the device.

## Calculators

| Calculator | Method |
| --- | --- |
| Heat Release Rate | Q̇ = ṁ″ × A × ΔHc |
| Flame Height | Heskestad: L = 0.235 Q̇^(2/5) − 1.02 D (solves for L, Q̇ or D) |
| Point Source Radiation | q″ = χr Q̇ / (4π R²), compared with NFPA 921 critical heat flux values |
| Flashover | MQH, Thomas and Babrauskas correlations |
| T-Squared Growth | Q̇ = α t² (heat release rate at a time, or time to a heat release rate) |

A Reference Data tab holds peak and steady-state heat release rates, heats of combustion,
mass flux values and t-squared growth data.

Inputs, the chosen unit system (imperial or SI) and saved calculations are kept in the
browser's local storage, so they survive switching calculators and reopening the app.

## Repository layout

- `frontend/`: the React + Vite app that is deployed.
  - `src/lib/`: the fire dynamics math (`fireMath.js`), unit handling (`units.js`),
    reference data (`materials.js`) and per-calculator logic (`calculations.js`), with unit tests.
  - `src/components/`: the calculator screens and shared UI.
- `backend/`: an earlier Python implementation of the calculations with its own tests.
  The deployed app does not use it.

## Development

Requires Node.js 20 or newer.

```sh
cd frontend
npm ci
npm run dev       # local development server
npm test          # unit tests for the calculations
npm run lint      # ESLint
npm run build     # production build in frontend/dist
npm run preview   # serve the production build locally
```

The app version comes from `frontend/package.json` and is shown in the app footer and the
web app manifest.

## Deployment

The production site is built from `frontend/` with `npm run build` and serves
`frontend/dist`. `public/_redirects` routes every path to `index.html`.
