// groupDetailView.js — group detail: name, leader badge, members + statuses.
//
// Rendered for the `groupDetail` route. The router calls renderAppShell(mount)
// first (which builds a persistent <header> plus an empty <main id="app-content">)
// and then renderGroupDetailView(mount, { groupId }). This view renders INTO the
// shell's `#app-content` region via getContentRegion(mount) — it does NOT clear
// the mount, so the header persists across navigations.
//
// Implements Requirements:
//   4.1 — display the group name as stored text truncated to a max of 100 chars.
//   4.2 — display exactly one member as the Leader, with the leader's display
//         name and a visible Leader label/badge.
//   4.3 — display the member list (each member's display name), up to 500.
//   4.4 — the Leader entry carries a persistent visual badge NOT applied to
//         non-leader members.
//   4.5 — when the group has only the leader (no other members), show an
//         empty-members indicator while still displaying the leader.
//   4.6 — when member data cannot be loaded, show an error indicator ("Group
//         details are unavailable") while retaining the group name and leader
//         display where available.
//   5.1 — each member's availability shows exactly one of Active / Inactive.
//   5.2 — Active vs Inactive indicators differ by more than color (text label
//         + icon/shape), not color alone.
//   5.5 — every displayed member has an availability-status indicator.

import { groups } from '../data.js';
import { buildGroupDetail, truncateName } from '../selectors.js';
import { getContentRegion } from './appShell.js';

/** Maximum characters of the group name shown in the detail view (Req 4.1). */
const NAME_MAX_LEN = 100;

/** Text shown when the group has no members other than the leader (Req 4.5). */
const NO_ADDITIONAL_MEMBERS = 'No additional members';

/** Text shown when member data cannot be loaded (Req 4.6). */
const MEMBERS_UNAVAILABLE = 'Group details are unavailable';

/**
 * Compute up to two uppercase initials from a display name (first letters of
 * the first two words). Falls back to '?' when no letters are available.
 *
 * @param {string} displayName
 * @returns {string}
 */
function initialsOf(displayName) {
  const words = String(displayName == null ? '' : displayName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
  return letters || '?';
}


/**
 * Build an availability-status pill that distinguishes Active from Inactive by
 * more than color: a shape/dot glyph plus a text label (Req 5.2). For Inactive
 * members with an `inactiveUntil` value, the label reads "Inactive until {when}"
 * rather than "Inactive" alone; when absent it falls back to "Inactive".
 *
 * @param {Document} doc
 * @param {'Active' | 'Inactive'} status
 * @param {string | null | undefined} [inactiveUntil]
 * @returns {HTMLElement}
 */
function buildStatusIndicator(doc, status, inactiveUntil) {
  const isActive = status === 'Active';

  const indicator = doc.createElement('span');
  indicator.className = `member__status member__status--${isActive ? 'active' : 'inactive'}`;
  indicator.dataset.status = status;

  // Text label — Active is just "Active"; Inactive shows the return time when
  // available so it differs from a bare "Inactive" (Req 5.1, 5.2).
  const labelText = isActive
    ? 'Active'
    : inactiveUntil
      ? `Inactive until ${inactiveUntil}`
      : 'Inactive';

  // Role/label so the status is announced independent of visual styling.
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-label', labelText);

  // Non-color cue: a distinct dot/shape per status (differs, not just color).
  // aria-hidden so assistive tech reads the text label, not the glyph.
  const icon = doc.createElement('span');
  icon.className = 'member__status-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = isActive ? '●' : '○';
  indicator.appendChild(icon);

  // Non-color cue: an explicit text label (Req 5.1, 5.2).
  const label = doc.createElement('span');
  label.className = 'member__status-label';
  label.textContent = labelText;
  indicator.appendChild(label);

  return indicator;
}

/**
 * Build a single member card: an avatar with initials, the display name, an
 * optional persistent Leader badge (Req 4.2, 4.4), and an availability-status
 * pill (Req 5.5). Each card retains the `member` hook class.
 *
 * @param {Document} doc
 * @param {{ id?: string, displayName?: string, availabilityStatus: 'Active'|'Inactive', isLeader: boolean, inactiveUntil?: string }} member
 * @returns {HTMLElement}
 */
function buildMemberRow(doc, member) {
  const item = doc.createElement('li');
  item.className = `member member-card${member.isLeader ? ' member-card--leader member--leader' : ''}`;
  if (member.id !== undefined) item.dataset.memberId = String(member.id);

  const displayName = member.displayName == null ? '' : String(member.displayName);

  // Avatar circle with the member's initials.
  const avatar = doc.createElement('span');
  avatar.className = 'member-card__avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = initialsOf(displayName);
  item.appendChild(avatar);

  // Name + optional Leader badge, grouped so the status pill can sit at the end.
  const body = doc.createElement('span');
  body.className = 'member-card__body';

  const name = doc.createElement('span');
  name.className = 'member-card__name member__name';
  name.textContent = displayName;
  body.appendChild(name);

  // Persistent Leader badge — present only on the leader entry (Req 4.2, 4.4).
  if (member.isLeader) {
    const badge = doc.createElement('span');
    badge.className = 'member__leader-badge';
    badge.textContent = 'Leader';
    body.appendChild(badge);
  }

  item.appendChild(body);

  item.appendChild(buildStatusIndicator(doc, member.availabilityStatus, member.inactiveUntil));

  return item;
}

/**
 * Render the group detail view into the app shell's content region.
 *
 * @param {HTMLElement} mount the shell mount element (contains header + #app-content)
 * @param {{ groupId?: string, simulateMemberLoadFailure?: boolean }} [options]
 */
export function renderGroupDetailView(mount, options = {}) {
  if (!mount) return;

  const doc = mount.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;

  // Render into the shell's content region so the persistent header survives.
  const content = getContentRegion(mount);
  content.replaceChildren();

  const groupId = options.groupId;
  const group = Array.isArray(groups) ? groups.find((g) => g && g.id === groupId) : undefined;

  const section = doc.createElement('section');
  section.className = 'group-detail';
  section.setAttribute('aria-labelledby', 'group-detail-title');

  // Guard: group missing or not found — show a not-found indicator and stop.
  if (!group) {
    const heading = doc.createElement('h1');
    heading.id = 'group-detail-title';
    heading.className = 'group-detail__title';
    heading.textContent = 'Group not found';
    section.appendChild(heading);

    const message = doc.createElement('p');
    message.className = 'group-detail__not-found';
    message.setAttribute('role', 'alert');
    message.textContent = 'The requested group could not be found.';
    section.appendChild(message);

    content.appendChild(section);
    return;
  }

  const detail = buildGroupDetail(group);

  // Group name, truncated to 100 chars (Req 4.1).
  const heading = doc.createElement('h1');
  heading.id = 'group-detail-title';
  heading.className = 'group-detail__title';
  heading.textContent = truncateName(String(detail.name == null ? '' : detail.name), NAME_MAX_LEN);
  section.appendChild(heading);

  // Subtitle / meta line under the title: total member count.
  const memberCount = detail.members.length;
  const meta = doc.createElement('p');
  meta.className = 'group-detail__meta';
  meta.textContent = `${memberCount} member${memberCount === 1 ? '' : 's'}`;
  section.appendChild(meta);

  const leaderEntry = detail.members.find((m) => m.isLeader) || null;

  // Simulated member-load failure (Req 4.6): retain the group name and the
  // leader display where available, but show an error for the member list.
  if (options.simulateMemberLoadFailure) {
    if (leaderEntry) {
      const leaderSection = doc.createElement('div');
      leaderSection.className = 'group-detail__leader';

      const leaderHeading = doc.createElement('h2');
      leaderHeading.className = 'group-detail__section-title';
      leaderHeading.textContent = 'Leader';
      leaderSection.appendChild(leaderHeading);

      const leaderList = doc.createElement('ul');
      leaderList.className = 'group-detail__members member-list';
      leaderList.appendChild(buildMemberRow(doc, leaderEntry));
      leaderSection.appendChild(leaderList);

      section.appendChild(leaderSection);
    }

    const error = doc.createElement('p');
    error.className = 'group-detail__members-error';
    error.setAttribute('role', 'alert');
    error.textContent = MEMBERS_UNAVAILABLE;
    section.appendChild(error);

    content.appendChild(section);
    return;
  }

  // Leader section — exactly one leader with a persistent badge (Req 4.2, 4.4).
  const leaderSection = doc.createElement('div');
  leaderSection.className = 'group-detail__leader';

  const leaderHeading = doc.createElement('h2');
  leaderHeading.className = 'group-detail__section-title';
  leaderHeading.textContent = 'Team Lead';
  leaderSection.appendChild(leaderHeading);

  const leaderList = doc.createElement('ul');
  leaderList.className = 'group-detail__members member-list';
  if (leaderEntry) {
    leaderList.appendChild(buildMemberRow(doc, leaderEntry));
  }
  leaderSection.appendChild(leaderList);
  section.appendChild(leaderSection);

  // Members section — all non-leader members, each with display name and an
  // availability indicator (Req 4.3, 5.1, 5.5).
  const membersSection = doc.createElement('div');
  membersSection.className = 'group-detail__members-section';

  const membersHeading = doc.createElement('h2');
  membersHeading.className = 'group-detail__section-title';
  membersHeading.textContent = 'Members';
  membersSection.appendChild(membersHeading);

  const otherMembers = detail.members.filter((m) => !m.isLeader);

  if (otherMembers.length === 0) {
    // Group has only the leader — empty-members indicator (Req 4.5).
    const empty = doc.createElement('p');
    empty.className = 'group-detail__empty-members';
    empty.setAttribute('role', 'status');
    empty.textContent = NO_ADDITIONAL_MEMBERS;
    membersSection.appendChild(empty);
  } else {
    const memberList = doc.createElement('ul');
    memberList.className = 'group-detail__members member-list';
    for (const member of otherMembers) {
      memberList.appendChild(buildMemberRow(doc, member));
    }
    membersSection.appendChild(memberList);
  }

  section.appendChild(membersSection);

  content.appendChild(section);
}
