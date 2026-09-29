// main.js — application bootstrap.
//
// Entry point loaded by index.html as an ES module. On init it loads and
// validates the demonstration data, then either:
//   - renders a top-level "Demonstration data failed to load" indicator with no
//     partial group content when validation fails (Req 6.6), or
//   - starts the app at the Login_View and dispatches the initial route on
//     success (Req 1.1), wiring hashchange-driven navigation end to end
//     (login → list → detail, sign-out) via the router (Req 2.6).
//
// Import safety: the module only auto-runs init() when a real browser DOM with
// an #app root is present, so importing it from a jsdom unit test does not
// trigger side effects. As the page entry point, main.js may statically import
// the router (no circular dependency — nothing imports main.js).

import { loadDemoData } from './repository.js';
import { state } from './state.js';
import { dispatch } from './router.js';

/** Message shown when the demonstration data cannot be loaded (Req 6.6). */
export const DATA_ERROR_MESSAGE = 'Demonstration data failed to load';

/**
 * Render the top-level data-load-error indicator into `root`. Clears any prior
 * content so no partial group content is shown (Req 6.6).
 *
 * @param {HTMLElement} root the mount element.
 */
function renderDataError(root) {
  if (!root) return;

  // Clear the mount so no partial group content remains (Req 6.6).
  root.replaceChildren();

  const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;

  const section = doc.createElement('section');
  section.className = 'data-error';
  section.setAttribute('role', 'alert');

  const message = doc.createElement('p');
  message.className = 'data-error__message';
  message.textContent = DATA_ERROR_MESSAGE;
  section.appendChild(message);

  root.appendChild(section);
}

/**
 * Bootstrap the application.
 *
 * Loads the demo data. On failure, flags the shared state and renders the
 * top-level load-error indicator with no partial group content, then stops
 * (no routing). On success, seeds the initial route to the Login_View when the
 * page has no hash yet (Req 1.1), dispatches the initial route, and subscribes
 * to hashchange so subsequent navigation re-dispatches through the router
 * (Req 2.6).
 *
 * @param {HTMLElement} [root] the mount element; defaults to `#app`.
 * @returns {{ ok: boolean }} whether the app started routing.
 */
export function init(root = (typeof document !== 'undefined' ? document.getElementById('app') : null)) {
  const result = loadDemoData();

  if (!result || result.ok === false) {
    // Data missing/invalid: flag state and render the load-error indicator with
    // no partial group content; do not proceed to routing (Req 6.6).
    state.dataError = true;
    renderDataError(root);
    return { ok: false };
  }

  state.dataError = false;

  // Start the app at the Login_View when no hash is present yet (Req 1.1).
  if (typeof window !== 'undefined' && window.location) {
    if (!window.location.hash) {
      window.location.hash = '#/login';
    }
  }

  // Re-dispatch on hash changes so navigation (login → list → detail, sign-out)
  // works end to end (Req 2.6).
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('hashchange', () => dispatch(root));
  }

  // Render the initial route.
  dispatch(root);

  return { ok: true };
}

// Auto-bootstrap when loaded as the page entry (guarded so tests can import the
// module without triggering side effects in a headless environment).
if (
  typeof window !== 'undefined' &&
  typeof document !== 'undefined' &&
  document.getElementById('app')
) {
  init();
}
