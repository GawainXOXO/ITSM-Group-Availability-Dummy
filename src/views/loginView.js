// loginView.js — GAR "ITSM Self-Service" sign-in card.
//
// The login screen owns the full screen on its own (no app shell): the
// presenter picks one of the predefined identities from a dropdown, then signs
// in (replacing any prior identity) and routes to the portal dashboard. No
// password is requested. Styled as a centered corporate sign-in card
// (reference: GAR ITSM Self-Service). The "Sign in with SSO" button is purely
// decorative.
//
// Implements Requirements:
//   1.1 — display the Login_View listing exactly the three users, each with a
//         distinct identifying label (as dropdown options).
//   1.2 — selecting a user signs in without requesting a password.
//   1.6 — selecting a different user replaces the prior identity (signIn does).
//   2.1 — the three users are the predefined demo identities (from data.js).

import { users } from '../data.js';
import { signIn } from '../state.js';

/**
 * Route to the portal dashboard after signing in. Setting the hash lets the
 * app's hashchange listener (main.js) re-dispatch; we also dispatch directly so
 * navigation works regardless of whether the listener is wired yet. The route
 * guard makes a follow-up hashchange re-dispatch idempotent.
 */
function goToDashboard() {
  if (typeof window !== 'undefined' && window.location) {
    window.location.hash = '#/dashboard';
  }
  // Dynamic import avoids a static import cycle (router.js imports this view)
  // and keeps the module importable in a headless test environment.
  import('../router.js')
    .then(({ dispatch }) => dispatch())
    .catch(() => {
      /* router unavailable (e.g. isolated import) — hashchange will handle it */
    });
}

/**
 * Render the login view into the given mount element. Clears the mount first;
 * the login view owns the full screen (no persistent app shell).
 *
 * @param {HTMLElement} mount the element to render into (e.g. `#app`).
 */
export function renderLoginView(mount) {
  if (!mount) return;

  // Clear any previously rendered view.
  mount.replaceChildren();

  const doc = mount.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;

  // Outer wrapper that centers the card on the screen.
  const screen = doc.createElement('div');
  screen.className = 'login-screen';

  // The sign-in card.
  const card = doc.createElement('section');
  card.className = 'login-card';
  card.setAttribute('aria-labelledby', 'login-title');

  // Brand row: red logo box + title/subtitle.
  const brand = doc.createElement('div');
  brand.className = 'login-card__brand';

  const logo = doc.createElement('div');
  logo.className = 'login-card__logo';
  logo.textContent = 'gar';
  brand.appendChild(logo);

  const brandText = doc.createElement('div');
  brandText.className = 'login-card__brand-text';
  const brandTitle = doc.createElement('div');
  brandTitle.className = 'login-card__brand-title';
  brandTitle.textContent = 'gar';
  const brandSub = doc.createElement('div');
  brandSub.className = 'login-card__brand-subtitle';
  brandSub.textContent = 'agribusiness and food';
  brandText.appendChild(brandTitle);
  brandText.appendChild(brandSub);
  brand.appendChild(brandText);

  card.appendChild(brand);

  // Red heading.
  const heading = doc.createElement('h1');
  heading.id = 'login-title';
  heading.className = 'login-card__heading';
  heading.textContent = 'ITSM Self-Service';
  card.appendChild(heading);

  // Muted subtitle.
  const subtitle = doc.createElement('p');
  subtitle.className = 'login-card__subtitle';
  subtitle.textContent = 'Sign in to continue';
  card.appendChild(subtitle);

  // User field: label + select dropdown.
  const field = doc.createElement('div');
  field.className = 'login-card__field';

  const label = doc.createElement('label');
  label.className = 'login-card__label';
  label.setAttribute('for', 'login-user-select');
  label.textContent = 'User';
  field.appendChild(label);

  const select = doc.createElement('select');
  select.className = 'login-card__select';
  select.id = 'login-user-select';

  // First option is a disabled, selected placeholder with an empty value.
  const placeholder = doc.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = 'Select a user…';
  select.appendChild(placeholder);

  for (const user of users) {
    const option = doc.createElement('option');
    option.value = user.id;
    option.textContent = user.label;
    select.appendChild(option);
  }

  field.appendChild(select);
  card.appendChild(field);

  // Red primary "Sign in" button — disabled until a real user is chosen.
  const submit = doc.createElement('button');
  submit.type = 'button';
  submit.className = 'login-card__submit';
  submit.textContent = 'Sign in';
  submit.disabled = true;
  card.appendChild(submit);

  // Enable/disable the submit button based on the select value.
  select.addEventListener('change', () => {
    submit.disabled = select.value === '';
  });

  submit.addEventListener('click', () => {
    const selectedUserId = select.value;
    if (!selectedUserId) return;
    // Sign in as the selected user (replaces any prior identity — Req 1.6),
    // then route to the portal dashboard. No password is requested (Req 1.2).
    signIn(selectedUserId);
    goToDashboard();
  });

  // "or" divider.
  const divider = doc.createElement('div');
  divider.className = 'login-card__divider';
  divider.textContent = 'or';
  card.appendChild(divider);

  // Decorative "Sign in with SSO" button — does nothing.
  const sso = doc.createElement('button');
  sso.type = 'button';
  sso.className = 'login-card__sso';
  sso.textContent = 'Sign in with SSO';
  sso.addEventListener('click', (event) => {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    // Decorative only — no navigation, no side effects.
  });
  card.appendChild(sso);

  screen.appendChild(card);
  mount.appendChild(screen);
}
