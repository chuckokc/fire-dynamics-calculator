/* global Netlify */
// Sits in front of the whole site. Without a valid access cookie, no app file
// is served. See lib/access.js for how it works.
// The code comes from the ACCESS_CODE environment variable (set in Netlify,
// not in this repo). Netlify reads it at build time, so after changing it,
// trigger a new deploy.
import { handleGate } from './lib/access.js';

export default async (request, context) =>
  handleGate(request, () => context.next(), { ACCESS_CODE: Netlify.env.get('ACCESS_CODE') });

export const config = {
  path: '/*',
  // Handled by access.js, or safe to serve publicly (install manifest and icons).
  excludedPath: ['/access', '/access/*', '/icons/*', '/favicon.ico', '/manifest.json', '/manifest.webmanifest'],
};
