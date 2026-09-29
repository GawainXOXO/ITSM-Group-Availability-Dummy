// groupListView.js — scoped, sorted group list with empty and error states.
//
// Renders the signed-in user's accessible groups into the app shell's content
// region (`#app-content`, from appShell.js) so the persistent header survives.
// The router calls renderAppShell(mount) first, then
// renderGroupListView(mount, { notice }).
//
// Behavior:
//   - Resolves the signed-in user from shared state, then uses the pure
//     `groupsInScope` selector to get the scoped, alphabetically-sorted groups.
//   - Renders each group name (truncated to 50 chars via `truncateName`) as a
//     clickable control that navigates to `#/groups/{id}`.
//   - Empty scope → Empty_State ("No groups available") with zero group entries.
//   - Simulated access-scope load failure → an error message plus a visible
//     Retry control that re-runs the load/render.
//   - An optional `notice` (e.g. the router guard's "not accessible" message)
//     is displayed prominently at the top of the list.
//
// Implements Requirements:
//   2.2, 2.3, 2.6 — display exactly the in-scope groups, based solely on the
//                   signed-in user's access scope.
//   2.4, 3.4      — Empty_State with a "no groups available" message and zero
//                   entries when the scope is empty.
//   2.5           — display the router guard's "not accessible" notice.
//   3.1           — list each in-scope group name, sorted alphabetically.
//   3.2           — truncate displayed names longer than 50 chars with an
//                   ellipsis indicator.
//   3.3           — selecting a group routes to its Group_Detail_View.
//   3.5           — on access-scope retrieval failure, show an error message
//                   and a Retry control that re-runs the load.
//
// Import safety: router.js statically imports this module, so navigation uses a
// DYNAMIC import of router.js (matching loginView.js) to avoid a static cycle.

import { state } from '../state.js';
import { users, groups } from '../data.js';
import { groupsInScope, truncateName } from '../selectors.js';
import { getContentRegion } from './appShell.js';

/** Maximum displayed length of a group name in the list (Req 3.2). */
const MAX_NAME_LEN = 50;

/**
 * Resolve the currently signed-in user object from shared state, or null when
 * signed out / when the id does not match a known user.
 * @returns {import('../data.js').User | null}
 */
function currentUser() {
  const id = state.currentUserId;
  if (!id) return null;
  return users.find((u) => u.id === id) || null;
}

/**
 * Navigate to a group's detail route. Setting the hash lets the app's
 * hashchange listener (main.js) re-dispatch; we also dispatch directly so
 * navigation works regardless of whether that listener is wired yet. A dynamic
 * import avoids a static import cycle (router.js imports this view).
 *
 * @param {string} groupId
 */
function goToGroupDetail(groupId) {
  if (typeof window !== 'undefined' && window.location) {
    window.location.hash = `#/groups/${encodeURIComponent(groupId)}`;
  }
  import('../router.js')
    .then(({ dispatch }) => dispatch())
    .catch(() => {
      /* router unavailable (e.g. isolated import) — hashchange will handle it */
    });
}

/**
 * Navigate to the Employee Inactive Request form. Mirrors goToGroupDetail's
 * navigation approach: set the hash and dynamically import the router to
 * dispatch immediately, avoiding a static import cycle.
 */
function goToInactiveRequest() {
  if (typeof window !== 'undefined' && window.location) {
    window.location.hash = '#/inactive-request';
  }
  import('../router.js')
    .then(({ dispatch }) => dispatch())
    .catch(() => {
      /* router unavailable (e.g. isolated import) — hashchange will handle it */
    });
}

/**
 * Build the action bar shown between the "Your Groups" heading and the list: a
 * button that routes to the Employee Inactive Request form.
 * @param {Document} doc
 * @returns {HTMLElement}
 */
function buildActionsBar(doc) {
  const actions = doc.createElement('div');
  actions.className = 'group-list-view__actions';

  const requestBtn = doc.createElement('button');
  requestBtn.type = 'button';
  requestBtn.className = 'group-list-view__request-btn';
  requestBtn.textContent = '＋ Request Inactive Status';
  requestBtn.addEventListener('click', goToInactiveRequest);
  actions.appendChild(requestBtn);

  return actions;
}

/**
 * Render the group list view into the app shell's content region.
 *
 * @param {HTMLElement} mount the shell mount element (typically `#app`). The
 *   app shell must already have been rendered into it so `#app-content` exists.
 * @param {Object} [options]
 * @param {string} [options.notice] a prominent notice to show at the top of the
 *   list (e.g. the router guard's "This group is not accessible" message).
 * @param {boolean} [options.simulateLoadFailure] when true, render the
 *   access-scope load-failure state (error message + Retry control) instead of
 *   the group list (Req 3.5).
 */
export function renderGroupListView(mount, options = {}) {
  if (!mount) return;

  const doc = mount.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;

  const content = getContentRegion(mount);
  content.replaceChildren();

  const section = doc.createElement('section');
  section.className = 'group-list-view';
  section.setAttribute('aria-labelledby', 'group-list-title');

  const heading = doc.createElement('h1');
  heading.id = 'group-list-title';
  heading.className = 'group-list-view__title';
  heading.textContent = 'Your Groups';
  section.appendChild(heading);

  // Prominent notice (e.g. the access-guard "not accessible" message — Req 2.5).
  if (options.notice) {
    const notice = doc.createElement('p');
    notice.className = 'group-list-view__notice';
    notice.setAttribute('role', 'status');
    notice.textContent = options.notice;
    section.appendChild(notice);
  }

  // Simulated access-scope retrieval failure: error message + Retry (Req 3.5).
  if (options.simulateLoadFailure) {
    section.appendChild(renderLoadError(doc, mount, options));
    content.appendChild(section);
    return;
  }

  // Action bar (between the heading/notice and the list): routes to the
  // Employee Inactive Request form. Shown on the normal list and empty state.
  section.appendChild(buildActionsBar(doc));

  const user = currentUser();

  // Groups within the signed-in user's scope, alphabetically sorted (Req 2.2,
  // 2.3, 2.6, 3.1). groupsInScope tolerates a null user (returns []).
  const scoped = groupsInScope(user, groups);

  if (scoped.length === 0) {
    // Empty_State: message + zero group entries (Req 2.4, 3.4).
    section.appendChild(renderEmptyState(doc));
    content.appendChild(section);
    return;
  }

  const list = doc.createElement('ul');
  list.className = 'group-list-view__groups';

  for (const group of scoped) {
    const item = doc.createElement('li');
    item.className = 'group-list-view__group';
    item.appendChild(buildGroupCard(doc, group));
    list.appendChild(item);
  }

  section.appendChild(list);
  content.appendChild(section);
}

/**
 * Build a rectangular, clickable group card. The whole card navigates to the
 * group's detail route (Req 3.3); clicking anywhere on it triggers the same
 * navigation. The card carries `data-group-id` and preserves the 50-char name
 * truncation with a title/aria-label fallback for long names (Req 3.2).
 *
 * @param {Document} doc
 * @param {import('../data.js').Group} group
 * @returns {HTMLElement}
 */
function buildGroupCard(doc, group) {
  const rawName = String(group.name);

  const card = doc.createElement('button');
  card.type = 'button';
  card.className = 'group-card';
  card.dataset.groupId = group.id;

  // Keep the full name available for accessibility / hover when truncated.
  if (rawName.length > MAX_NAME_LEN) {
    card.title = rawName;
    card.setAttribute('aria-label', rawName);
  }

  card.addEventListener('click', () => {
    goToGroupDetail(group.id);
  });

  // Top row: avatar chip + name.
  const header = doc.createElement('span');
  header.className = 'group-card__header';

  const icon = doc.createElement('span');
  icon.className = 'group-card__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '👥';
  header.appendChild(icon);

  const name = doc.createElement('span');
  name.className = 'group-card__name';
  // Truncate names longer than 50 chars with an ellipsis (Req 3.2).
  name.textContent = truncateName(rawName, MAX_NAME_LEN);
  header.appendChild(name);

  card.appendChild(header);

  // Meta line: member counts, computed defensively from the group's members.
  const members = Array.isArray(group.members) ? group.members : [];
  const total = members.length;
  const active = members.filter((m) => m && m.availabilityStatus === 'Active').length;

  const meta = doc.createElement('span');
  meta.className = 'group-card__meta';
  meta.textContent = `${total} member${total === 1 ? '' : 's'} · ${active} active`;
  card.appendChild(meta);

  // "View more »" affordance — a span so it never swallows the card click.
  const more = doc.createElement('span');
  more.className = 'group-card__more';
  more.setAttribute('aria-hidden', 'true');
  more.textContent = 'View more »';
  card.appendChild(more);

  return card;
}

/**
 * Build the Empty_State element: a message indicating no groups are available
 * and zero group entries (Req 2.4, 3.4).
 * @param {Document} doc
 * @returns {HTMLElement}
 */
function renderEmptyState(doc) {
  const empty = doc.createElement('div');
  empty.className = 'group-list-view__empty';
  empty.setAttribute('role', 'status');

  const message = doc.createElement('p');
  message.className = 'group-list-view__empty-message';
  message.textContent = 'No groups available';
  empty.appendChild(message);

  return empty;
}

/**
 * Build the access-scope load-failure element: an error message plus a visible
 * Retry control that re-invokes the load/render (Req 3.5). Retry clears the
 * simulated-failure flag so the subsequent render attempts the real load.
 *
 * @param {Document} doc
 * @param {HTMLElement} mount
 * @param {Object} options the options the view was invoked with.
 * @returns {HTMLElement}
 */
function renderLoadError(doc, mount, options) {
  const errorBox = doc.createElement('div');
  errorBox.className = 'group-list-view__error';
  errorBox.setAttribute('role', 'alert');

  const message = doc.createElement('p');
  message.className = 'group-list-view__error-message';
  message.textContent = 'Could not load your groups';
  errorBox.appendChild(message);

  const retry = doc.createElement('button');
  retry.type = 'button';
  retry.className = 'group-list-view__retry';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => {
    // Re-run the load/render. Clear the simulated-failure flag so the retry
    // attempts the real load and shows the resolved list or empty state.
    const retryOptions = { ...options, simulateLoadFailure: false };
    renderGroupListView(mount, retryOptions);
  });
  errorBox.appendChild(retry);

  return errorBox;
}
