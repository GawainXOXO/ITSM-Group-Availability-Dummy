// dashboardView.js — realistic corporate support-portal dashboard (MOCKUP).
//
// This view owns the WHOLE screen (dark sidebar + white topbar + light content
// area). It is a visual mockup styled after the "GAR — agribusiness and food"
// support portal. Only the "Availability" sidebar item is functional: it
// navigates to the existing group-availability feature (`#/groups`). Every
// other button/link on the screen is DECORATIVE — clicking it does nothing
// (the handler calls event.preventDefault() and returns).
//
// It does NOT use the group-availability appShell; it renders directly into the
// mount (clearing it first with replaceChildren).
//
// Import safety: router.js statically imports this module, so navigation uses a
// DYNAMIC import of router.js (matching loginView.js) to avoid a static cycle.

/**
 * Navigate to the group-availability feature. Setting the hash lets the app's
 * hashchange listener (main.js) re-dispatch; we also dispatch directly so
 * navigation works regardless of whether that listener is wired yet. A dynamic
 * import avoids a static import cycle (router.js imports this view).
 */
function goToGroups() {
  if (typeof window !== 'undefined' && window.location) {
    window.location.hash = '#/groups';
  }
  import('../router.js')
    .then(({ dispatch }) => dispatch())
    .catch(() => {
      /* router unavailable (e.g. isolated import) — hashchange will handle it */
    });
}

/**
 * Attach a decorative (inert) click handler: prevent default and do nothing
 * else. Used for all the fake buttons/links on the mockup.
 * @param {HTMLElement} el
 */
function makeInert(el) {
  el.addEventListener('click', (event) => {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    // Decorative only — no navigation, no side effects.
  });
}

/**
 * The sidebar navigation items. Only "Availability" is functional.
 * @type {Array<{ icon: string, label: string, functional?: boolean }>}
 */
const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard' },
  { icon: '🎫', label: 'My Tickets' },
  { icon: '👥', label: 'Group Queue' },
  { icon: '🗂️', label: 'All Tickets' },
  { icon: '✅', label: 'Approvals' },
  { icon: '📄', label: 'Contracts' },
  { icon: '🟢', label: 'Availability', functional: true },
];

/**
 * The four summary stat cards shown at the top of the content area.
 * @type {Array<{ icon: string, chip: string, label: string }>}
 */
const STAT_CARDS = [
  { icon: '🎫', chip: 'dash-card__chip--blue', label: 'My Open Work' },
  { icon: '👥', chip: 'dash-card__chip--purple', label: 'Group Queue' },
  { icon: '✅', chip: 'dash-card__chip--amber', label: 'Awaiting My Approval' },
  { icon: '📈', chip: 'dash-card__chip--green', label: 'Resolved (MTD)' },
];

/**
 * Build the dark left sidebar element. The nav item whose label matches
 * `activeLabel` is marked active (`dash-nav-item--active`). Exported so the
 * app shell can reuse the identical sidebar chrome for the group feature.
 * @param {Document} doc
 * @param {string} [activeLabel] label of the nav item to highlight
 * @returns {HTMLElement}
 */
export function buildSidebar(doc, activeLabel = 'Dashboard') {
  const sidebar = doc.createElement('aside');
  sidebar.className = 'dash-sidebar';

  // Brand / logo mark.
  const brand = doc.createElement('div');
  brand.className = 'dash-brand';

  const logo = doc.createElement('div');
  logo.className = 'dash-brand__logo';
  logo.textContent = 'gar';
  brand.appendChild(logo);

  const brandText = doc.createElement('div');
  brandText.className = 'dash-brand__text';
  const brandTitle = doc.createElement('div');
  brandTitle.className = 'dash-brand__title';
  brandTitle.textContent = 'GAR';
  const brandSub = doc.createElement('div');
  brandSub.className = 'dash-brand__subtitle';
  brandSub.textContent = 'agribusiness and food';
  brandText.appendChild(brandTitle);
  brandText.appendChild(brandSub);
  brand.appendChild(brandText);

  sidebar.appendChild(brand);

  // Navigation.
  const nav = doc.createElement('nav');
  nav.className = 'dash-nav';
  nav.setAttribute('aria-label', 'Primary');

  for (const entry of NAV_ITEMS) {
    const item = doc.createElement('button');
    item.type = 'button';
    item.className = 'dash-nav-item';
    if (entry.label === activeLabel) item.classList.add('dash-nav-item--active');

    const icon = doc.createElement('span');
    icon.className = 'dash-nav-item__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = entry.icon;
    item.appendChild(icon);

    const label = doc.createElement('span');
    label.className = 'dash-nav-item__label';
    label.textContent = entry.label;
    item.appendChild(label);

    if (entry.functional) {
      // Only "Availability" navigates to the real feature.
      item.addEventListener('click', (event) => {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        goToGroups();
      });
    } else {
      makeInert(item);
    }

    nav.appendChild(item);
  }

  sidebar.appendChild(nav);

  // Decorative round red button pinned near the bottom-left.
  const fab = doc.createElement('button');
  fab.type = 'button';
  fab.className = 'dash-sidebar__fab';
  fab.setAttribute('aria-label', 'Help');
  fab.textContent = '?';
  makeInert(fab);
  sidebar.appendChild(fab);

  return sidebar;
}

/**
 * Build the white topbar element. Exported so the app shell can reuse the
 * identical topbar chrome for the group feature.
 * @param {Document} doc
 * @returns {HTMLElement}
 */
export function buildTopbar(doc) {
  const topbar = doc.createElement('header');
  topbar.className = 'dash-topbar';

  // Hamburger (decorative).
  const hamburger = doc.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'dash-topbar__hamburger';
  hamburger.setAttribute('aria-label', 'Toggle navigation');
  hamburger.textContent = '☰';
  makeInert(hamburger);
  topbar.appendChild(hamburger);

  // Centered helper text.
  const helper = doc.createElement('div');
  helper.className = 'dash-topbar__helper';
  const line1 = doc.createElement('div');
  line1.className = 'dash-topbar__helper-line';
  line1.textContent = 'Kindly contact the IT Service Desk during the development phase.';
  const line2 = doc.createElement('div');
  line2.className = 'dash-topbar__helper-line dash-topbar__helper-line--muted';
  line2.textContent =
    'Issue Logging Portal (Temporary portal for Issue Tracker): https://portal.example.internal/issues';
  helper.appendChild(line1);
  helper.appendChild(line2);
  topbar.appendChild(helper);

  // Right-hand cluster.
  const right = doc.createElement('div');
  right.className = 'dash-topbar__right';

  // Language dropdown pill (decorative).
  const lang = doc.createElement('button');
  lang.type = 'button';
  lang.className = 'dash-topbar__lang';
  lang.textContent = 'English ▾';
  makeInert(lang);
  right.appendChild(lang);

  // Bell with badge (decorative).
  const bell = doc.createElement('button');
  bell.type = 'button';
  bell.className = 'dash-topbar__bell';
  bell.setAttribute('aria-label', 'Notifications');
  bell.textContent = '🔔';
  const badge = doc.createElement('span');
  badge.className = 'dash-topbar__bell-badge';
  badge.textContent = '3';
  bell.appendChild(badge);
  makeInert(bell);
  right.appendChild(bell);

  // Log Out link (decorative — per the mockup requirement, does NOT sign out).
  const logout = doc.createElement('a');
  logout.className = 'dash-topbar__logout';
  logout.href = '#';
  logout.setAttribute('role', 'button');
  logout.textContent = 'Log Out';
  makeInert(logout);
  right.appendChild(logout);

  topbar.appendChild(right);

  return topbar;
}

/**
 * Build a single stat card.
 * @param {Document} doc
 * @param {{ icon: string, chip: string, label: string }} spec
 * @returns {HTMLElement}
 */
function buildStatCard(doc, spec) {
  const card = doc.createElement('div');
  card.className = 'dash-card';

  const chip = doc.createElement('div');
  chip.className = `dash-card__chip ${spec.chip}`;
  chip.setAttribute('aria-hidden', 'true');
  chip.textContent = spec.icon;
  card.appendChild(chip);

  const number = doc.createElement('div');
  number.className = 'dash-card__number';
  number.textContent = '0';
  card.appendChild(number);

  const label = doc.createElement('div');
  label.className = 'dash-card__label';
  label.textContent = spec.label;
  card.appendChild(label);

  const link = doc.createElement('a');
  link.className = 'dash-card__link';
  link.href = '#';
  link.setAttribute('role', 'button');
  link.textContent = 'View details →';
  makeInert(link);
  card.appendChild(link);

  return card;
}

/**
 * Build a content panel (title + "View All" link + centered muted body text).
 * @param {Document} doc
 * @param {string} title
 * @param {string} emptyText
 * @param {string} [extraClass]
 * @returns {HTMLElement}
 */
function buildPanel(doc, title, emptyText, extraClass) {
  const panel = doc.createElement('section');
  panel.className = 'dash-panel';
  if (extraClass) panel.classList.add(extraClass);

  const head = doc.createElement('div');
  head.className = 'dash-panel__head';

  const heading = doc.createElement('h2');
  heading.className = 'dash-panel__title';
  heading.textContent = title;
  head.appendChild(heading);

  const viewAll = doc.createElement('a');
  viewAll.className = 'dash-panel__view-all';
  viewAll.href = '#';
  viewAll.setAttribute('role', 'button');
  viewAll.textContent = 'View All';
  makeInert(viewAll);
  head.appendChild(viewAll);

  panel.appendChild(head);

  const body = doc.createElement('div');
  body.className = 'dash-panel__body';
  const empty = doc.createElement('p');
  empty.className = 'dash-panel__empty';
  empty.textContent = emptyText;
  body.appendChild(empty);
  panel.appendChild(body);

  return panel;
}

/**
 * Build the main content area (greeting + stat cards + panels).
 * @param {Document} doc
 * @returns {HTMLElement}
 */
function buildContent(doc) {
  const content = doc.createElement('main');
  content.className = 'dash-content';

  const greeting = doc.createElement('div');
  greeting.className = 'dash-greeting';
  const heading = doc.createElement('h1');
  heading.className = 'dash-greeting__title';
  heading.textContent = 'Good Morning, ';
  const sub = doc.createElement('p');
  sub.className = 'dash-greeting__subtitle';
  sub.textContent = "Here's what needs your attention today.";
  greeting.appendChild(heading);
  greeting.appendChild(sub);
  content.appendChild(greeting);

  // Stat cards.
  const cards = doc.createElement('div');
  cards.className = 'dash-cards';
  for (const spec of STAT_CARDS) {
    cards.appendChild(buildStatCard(doc, spec));
  }
  content.appendChild(cards);

  // Two panels side by side.
  const panels = doc.createElement('div');
  panels.className = 'dash-panels';
  panels.appendChild(
    buildPanel(doc, 'My Open Work', 'Nothing assigned to you right now.', 'dash-panel--wide')
  );
  panels.appendChild(
    buildPanel(doc, 'Waiting On My Approval', 'No approvals waiting on you.')
  );
  content.appendChild(panels);

  return content;
}

/**
 * Render the full portal dashboard (sidebar + topbar + content) into the mount.
 * Clears the mount first. This view owns the whole screen and does NOT use the
 * group-availability app shell.
 *
 * Only the "Availability" sidebar item is functional (navigates to `#/groups`);
 * every other control is decorative (inert).
 *
 * @param {HTMLElement} mount the element to render into (e.g. `#app`).
 */
export function renderDashboardView(mount) {
  if (!mount) return;

  const doc = mount.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;

  // Clear any previously rendered view — the dashboard owns the full screen.
  mount.replaceChildren();

  const layout = doc.createElement('div');
  layout.className = 'dash-layout';

  layout.appendChild(buildSidebar(doc, 'Dashboard'));

  const mainArea = doc.createElement('div');
  mainArea.className = 'dash-main';
  mainArea.appendChild(buildTopbar(doc));
  mainArea.appendChild(buildContent(doc));

  layout.appendChild(mainArea);

  mount.appendChild(layout);
}
