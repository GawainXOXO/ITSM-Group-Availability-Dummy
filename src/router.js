// router.js — hash-based route parsing and guarded dispatch.
//
// Keeps parsing pure and testable: `parseRoute(hash)` turns a raw location
// hash into a plain Route descriptor with no side effects, while `dispatch`
// applies authentication/access guards and delegates to the matching view
// renderer.
//
// Route shapes (consistent with state.js `state.route`):
//   { name: 'login' }
//   { name: 'groupList' }         // optional `notice` added by the guard
//   { name: 'groupDetail', id }
//
// Supported hashes: `#/login`, `#/groups`, `#/groups/:id`. Anything else
// (empty, `#`, `#/`, unknown paths) falls back to the login route.
//
// Implements Requirements 2.5 (out-of-scope detail is blocked and the user is
// kept on the list with a "not accessible" notice) and 3.3 (selecting a group
// routes to its detail view).

import { state } from './state.js';
import { users, groups } from './data.js';
import { isAccessible } from './selectors.js';
import { renderAppShell } from './views/appShell.js';
import { renderDashboardView } from './views/dashboardView.js';
import { renderLoginView } from './views/loginView.js';
import { renderGroupListView } from './views/groupListView.js';
import { renderGroupDetailView } from './views/groupDetailView.js';
import { renderRequestFormView } from './views/requestFormView.js';

/** Message shown on the group list when an out-of-scope detail is requested. */
export const NOT_ACCESSIBLE_NOTICE = 'This group is not accessible';

/**
 * Parse a location hash into a Route descriptor. Pure — no side effects, no
 * reads of global state. Tolerates a missing leading `#`, a trailing slash,
 * and empty segments.
 *
 * @param {string} hash e.g. `#/dashboard`, `#/groups`, `#/groups/cyber-security`, `#/login`
 * @returns {{ name: 'login' } | { name: 'dashboard' } | { name: 'groupList' } | { name: 'groupDetail', id: string }}
 */
export function parseRoute(hash) {
  const raw = typeof hash === 'string' ? hash : '';

  // Strip a single leading '#', then a single leading '/'.
  let path = raw.startsWith('#') ? raw.slice(1) : raw;
  if (path.startsWith('/')) path = path.slice(1);

  // Split into non-empty segments so `#/groups/` == `#/groups`.
  const segments = path.split('/').filter((s) => s.length > 0);

  if (segments.length === 0) {
    return { name: 'login' };
  }

  const [head, second] = segments;

  if (head === 'login') {
    return { name: 'login' };
  }

  if (head === 'dashboard') {
    return { name: 'dashboard' };
  }

  if (head === 'inactive-request') {
    return { name: 'inactiveRequest' };
  }

  if (head === 'groups') {
    if (second !== undefined) {
      return { name: 'groupDetail', id: decodeURIComponent(second) };
    }
    return { name: 'groupList' };
  }

  // Unknown path — fall back to login.
  return { name: 'login' };
}

/**
 * Resolve the currently signed-in user object from state, or null.
 * @returns {import('./data.js').User | null}
 */
function currentUser() {
  const id = state.currentUserId;
  if (!id) return null;
  return users.find((u) => u.id === id) || null;
}

/**
 * Apply authentication and access guards to a parsed route, returning the
 * route that should actually be rendered. Pure with respect to its inputs
 * (reads only the passed-in user), so it is straightforward to test.
 *
 * Guards:
 *  - Any route other than `login` requires a signed-in user; otherwise fall
 *    back to the login route.
 *  - A `groupDetail` route for a group outside the user's access scope falls
 *    back to `groupList` with a "not accessible" notice (Req 2.5).
 *
 * @param {{ name: string, id?: string }} route
 * @param {import('./data.js').User | null} user
 * @returns {{ name: string, id?: string, notice?: string }}
 */
export function guardRoute(route, user) {
  // Login is always reachable.
  if (route.name === 'login') {
    return { name: 'login' };
  }

  // All other routes require an authenticated user.
  if (!user) {
    return { name: 'login' };
  }

  // The dashboard is the default authenticated landing (requires a user).
  if (route.name === 'dashboard') {
    return { name: 'dashboard' };
  }

  // The Employee Inactive Request form (requires a signed-in user).
  if (route.name === 'inactiveRequest') {
    return { name: 'inactiveRequest' };
  }

  if (route.name === 'groupDetail') {
    if (!isAccessible(user, route.id)) {
      // Out-of-scope: keep the user on the list with a notice (Req 2.5).
      return { name: 'groupList', notice: NOT_ACCESSIBLE_NOTICE };
    }
    return { name: 'groupDetail', id: route.id };
  }

  if (route.name === 'groupList') {
    return { name: 'groupList' };
  }

  // Unknown route name — default to the list for a signed-in user.
  return { name: 'groupList' };
}

/**
 * Parse the current location hash, apply guards, persist the resolved route on
 * the shared state, and render the matching view into `root`.
 *
 * @param {HTMLElement} [root] the mount point; defaults to `#app` when omitted.
 * @returns {{ name: string, id?: string, notice?: string }} the resolved route.
 */
export function dispatch(root) {
  const hash = typeof window !== 'undefined' && window.location ? window.location.hash : '';
  const parsed = parseRoute(hash);
  const user = currentUser();
  const resolved = guardRoute(parsed, user);

  // Persist the resolved route so views/shell can read the active route.
  state.route = resolved;

  const mount =
    root ||
    (typeof document !== 'undefined' ? document.getElementById('app') : null);

  // Nothing to render into (e.g. a headless import) — return the resolution.
  if (!mount) return resolved;

  // The app shell (header with identity + sign-out) is persistent across the
  // authenticated views; the login view owns the full screen on its own.
  switch (resolved.name) {
    case 'login':
      renderLoginView(mount);
      break;
    case 'dashboard':
      // The dashboard owns the full screen (no app shell).
      renderDashboardView(mount);
      break;
    case 'groupList':
      renderAppShell(mount);
      renderGroupListView(mount, { notice: resolved.notice });
      break;
    case 'groupDetail':
      renderAppShell(mount);
      renderGroupDetailView(mount, { groupId: resolved.id });
      break;
    case 'inactiveRequest':
      // Same portal chrome as the group list: shell first, then the form.
      renderAppShell(mount);
      renderRequestFormView(mount);
      break;
    default:
      renderLoginView(mount);
      break;
  }

  return resolved;
}

// Re-export data collections that dispatch relies on, for convenience in tests.
export { groups };
