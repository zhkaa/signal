import { request } from './lib/api.js';
const params = new URLSearchParams(location.search);
const token = params.get('token_hash');
let locale = document.documentElement.lang;
// Remove the single-use token from the address bar before any navigation.
history.replaceState({}, '', location.pathname + '?lang=' + locale);
function rememberLocale(value) {
  try {
    localStorage.setItem('signal-locale', value);
  } catch {
    /* Optional preference. */
  }
}
document.getElementById('confirmation-language')?.addEventListener('click', () => {
  const next = locale === 'en' ? 'ru' : 'en';
  rememberLocale(next);
  const url = new URL(location.href);
  url.searchParams.set('lang', next);
  if (token) url.searchParams.set('token_hash', token);
  location.replace(url);
});
document.getElementById('confirmation-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.getElementById('confirm-email');
  if (button.disabled) return;
  const error = document.getElementById('confirmation-error');
  const label = button.textContent;
  button.disabled = true;
  button.textContent = button.dataset.working;
  event.currentTarget.setAttribute('aria-busy', 'true');
  error.hidden = true;
  try {
    await request('/api/auth/confirm', {
      method: 'POST',
      body: JSON.stringify({ token_hash: token }),
    });
    rememberLocale(locale);
    location.replace('/email-confirmed?lang=' + locale);
  } catch (failure) {
    error.textContent =
      failure.code === 'CONFIRMATION_INVALID' ? button.dataset.failure : button.dataset.retry;
    error.hidden = false;
    error.setAttribute('tabindex', '-1');
    error.focus();
  } finally {
    button.disabled = false;
    button.textContent = label;
    document.getElementById('confirmation-form').setAttribute('aria-busy', 'false');
  }
});
