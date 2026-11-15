// Sends the site's forms (the feedback window in the app) to Netlify Forms, which
// stores them and emails the site owner. The forms are declared in
// public/forms.html, and that page is also where Netlify expects the POST. It is
// a public path (the access gate skips it), so this works signed out or signed in.
export const FORMS_PATH = '/forms.html';

// Must match the "feedback" form in public/forms.html (tests/forms.test.js checks).
export const FEEDBACK_FORM = {
  name: 'feedback',
  subject: 'Fire Dynamics Calculator feedback',
  fields: ['message', 'email', 'app_version'],
};

// Resolves to 'sent' or 'failed'. It never throws, so callers can just show the result.
export async function submitForm(formName, fields, fetchFn = (...args) => fetch(...args)) {
  const body = new URLSearchParams({ 'form-name': formName, ...fields }).toString();
  try {
    const response = await fetchFn(FORMS_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return response.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}
