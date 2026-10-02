// Sharing and copying results as plain text.

export const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

// Opens the phone's share sheet (Messages, Mail, Notes...). Returns false if
// the person closed it without sharing.
export async function shareText(title, text) {
  try {
    await navigator.share({ title, text });
    return true;
  } catch (error) {
    if (error?.name === 'AbortError') return false;
    throw error;
  }
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy method below.
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
}

// Builds the text shared or copied for a result.
export function buildReport({ title, method, results = [], inputs = [], notes = [] }) {
  const lines = [`Fire Dynamics Calculator – ${title}`, `Date: ${new Date().toLocaleString()}`];
  if (method) lines.push(`Method: ${method}`);
  lines.push('', 'Result:', ...results.map((line) => `- ${line}`));
  if (inputs.length) lines.push('', 'Inputs:', ...inputs.map((line) => `- ${line}`));
  if (notes.length) lines.push('', ...notes);
  return lines.join('\n');
}
