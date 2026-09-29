// appShell.js — persistent application shell rendered for authenticated (group)
// views.
//
// The group feature now sits inside the SAME portal chrome as the dashboard: a
// dark sidebar (with the "Availability" nav item highlighted) and the white
// topbar. Beneath the topbar a slim in-feature header (class "app-header")
// carries the controls the group feature relies on:
//
//   - a "← Dashboard" back button (Req: return to the portal dashboard),
//   - the signed-in user's identifying label (Req 1.3),
//   - a visible, selectable "Sign out" control (Req 1.4).
//
// DOM CONTRACT
// ------------
// The router calls renderAppShell(root) and then immediately calls the active
// content view — renderGroupListView(root, ...) / renderGroupDetailView(root, ...).
// renderAppShell RESETS `root` and builds the portal layout:
//
//   <div class="dash-layout">
//     <aside class="dash-sidebar"> ... Availability active ... </aside>
//     <div class="dash-main">
//       <header class="dash-topbar"> ... </header>
//       <header class="app-header"> back + identity + sign-out </header>
//       <main id="app-content" class="app-content"></main>
//     </div>
//   </div>
//
// Content views render into the element with id "app-content" (exported as
// CONTENT_ID) rather than clearing `root`, so the persistent chrome survives
// across navigations. A helper `getContentRegion` is exported so those views
// can locate (or lazily create) the content region.
//
// Import safety: router.js statically imports this module, so this module must
// NOT statically import router.js (that would create a circular import).
// Sign-out and the back button therefore set window.location.hash and use a
// DYNAMIC import of router.js to call dispatch() so the target view re-renders
// immediately, independent of the hashchange listener wired later in main.js.
//
// The sidebar/topbar chrome is reused from dashboardView.js (buildSidebar /
// buildTopbar); dashboardView.js does not statically import this module, so no
// import cycle is introduced.

import { state, signOut } from '../state.js';
import { users } from '../data.js';
import { buildSidebar, buildTopbar } from './dashboardView.js';

/** The id of the content region that content views render into. */
export const CONTENT_ID = 'app-content';

/**
 * Resolve the currently signed-in user object from shared state, or null when
 * signed out or when the id does not match a known user.
 * @returns {import('../data.js').User | null}
 */
function currentUser() {
  const id = state.currentUserId;
  if (!id) return null;
  return users.find((u) => u.id === id) || null;
}

/**
 * Return the shell's content region element, creating it if it is missing.
 * Content views (group list / group detail) should render into this element so
 * the persistent chrome is preserved. Searches anywhere within `root`, and
 * when absent appends to the portal main (`.dash-main`) if present, else to
 * `root`.
 *
 * @param {HTMLElement} root the shell mount element
 * @returns {HTMLElement} the `#app-content` region
 */
export function getContentRegion(root) {
  let content = root.querySelector(`#${CONTENT_ID}`);
  if (!content) {
    const doc = root.ownerDocument || document;
    content = doc.createElement('main');
    content.id = CONTENT_ID;
    content.className = 'app-content';
    const main = root.querySelector('.dash-main');
    (main || root).appendChild(content);
  }
  return content;
}

/**
 * Render the persistent app shell — the portal chrome (sidebar + topbar) plus a
 * slim in-feature header (back / identity / sign-out) — into `root` and prepare
 * an empty content region for the active view.
 *
 * Resets `root` and builds a `.dash-layout` matching the dashboard, with the
 * "Availability" sidebar item highlighted.
 *
 * @param {HTMLElement} root the mount element (typically `#app`)
 */
export function renderAppShell(root) {
  if (!root) return;
  const doc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;

  // Reset the shell so re-renders don't stack duplicate chrome.
  root.textContent = '';

  const layout = doc.createElement('div');
  layout.className = 'dash-layout';

  // Reuse the dashboard's dark sidebar, highlighting the group feature's
  // "Availability" nav item.
  layout.appendChild(buildSidebar(doc, 'Availability'));

  const mainArea = doc.createElement('div');
  mainArea.className = 'dash-main';

  // Reuse the dashboard's white topbar.
  mainArea.appendChild(buildTopbar(doc));

  // Slim in-feature header (kept as .app-header) with the controls the group
  // feature relies on.
  const header = doc.createElement('header');
  header.className = 'app-header';

  // "← Dashboard" return control (left side): routes back to the portal
  // dashboard. Uses a DYNAMIC import of router.js to avoid a static circular
  // import.
  const backBtn = doc.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'app-header__back';
  backBtn.textContent = '← Dashboard';
  backBtn.addEventListener('click', () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = '#/dashboard';
    }
    import('../router.js')
      .then((mod) => {
        if (mod && typeof mod.dispatch === 'function') mod.dispatch(root);
      })
      .catch(() => {
        /* no-op: hashchange listener (main.js) will re-dispatch as a fallback */
      });
  });
  header.appendChild(backBtn);

  const user = currentUser();

  // Identity label of the signed-in user (Req 1.3).
  const identity = doc.createElement('span');
  identity.className = 'app-header__identity';
  if (user) {
    identity.textContent = user.label;
    identity.setAttribute('aria-label', `Signed in as ${user.label}`);
  } else {
    // Defensive: the shell is only rendered for authenticated routes, but keep
    // a sensible label if state is somehow cleared.
    identity.textContent = 'Not signed in';
  }
  header.appendChild(identity);

  // Visible, selectable sign-out control (Req 1.4).
  const signOutBtn = doc.createElement('button');
  signOutBtn.type = 'button';
  signOutBtn.className = 'app-header__sign-out';
  signOutBtn.textContent = 'Sign out';
  signOutBtn.addEventListener('click', () => {
    // Clear the signed-in identity (Req 1.5)...
    signOut();
    // ...route to the login screen...
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = '#/login';
    }
    // ...and re-render via the router. A DYNAMIC import avoids a static
    // circular import (router.js imports this module) while still guaranteeing
    // the login view is shown after sign-out (Req 1.5), independent of any
    // hashchange listener wired later in main.js.
    import('../router.js')
      .then((mod) => {
        if (mod && typeof mod.dispatch === 'function') mod.dispatch(root);
      })
      .catch(() => {
        /* no-op: hashchange listener (main.js) will re-dispatch as a fallback */
      });
  });
  header.appendChild(signOutBtn);

  mainArea.appendChild(header);

  layout.appendChild(mainArea);
  root.appendChild(layout);

  // Prepare the empty content region the active view renders into (appended to
  // .dash-main, beneath the in-feature header).
  getContentRegion(root);
}
