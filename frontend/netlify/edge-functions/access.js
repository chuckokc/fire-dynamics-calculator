/* global Netlify */
// The login page, code check, and the app's "still signed in?" ping.
// See lib/access.js for how it works.
import { handleAccess } from './lib/access.js';

export default async (request) => handleAccess(request, { ACCESS_CODE: Netlify.env.get('ACCESS_CODE') });

export const config = {
  path: ['/access', '/access/*'],
  // Limits guessing: 100 requests per minute per IP address. Generous enough
  // for a classroom sharing one network connection.
  rateLimit: { windowLimit: 100, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
