// Asks the server whether this device is still signed in (see netlify/edge-functions).
// Only a clear "no" (401) sends the person back to the access page. Being offline,
// or the server having a bad moment, never locks anyone out of a cached app.
export async function checkAccess({
  fetchFn = (...args) => fetch(...args),
  goToLogin = () => window.location.assign('/access'),
} = {}) {
  try {
    const response = await fetchFn('/access/status', { cache: 'no-store', credentials: 'same-origin' });
    if (response.status === 401) {
      goToLogin();
      return 'signed-out';
    }
    return response.ok ? 'signed-in' : 'unknown';
  } catch {
    return 'offline';
  }
}
