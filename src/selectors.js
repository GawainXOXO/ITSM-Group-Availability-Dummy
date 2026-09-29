// selectors.js — pure logic layer: scope filtering, sorting, truncation,
// availability normalization, and group-detail assembly.
// Implemented in task 4. Stubs keep the public interface importable.

/**
 * Groups within a user's access scope, sorted ascending alphabetically by name.
 * Returns exactly the groups whose id appears in `user.accessGroupIds`.
 * (Req 2.2, 2.3, 2.6, 3.1)
 */
export function groupsInScope(user, groups) {
  const accessIds = user && Array.isArray(user.accessGroupIds) ? user.accessGroupIds : [];
  const scopeSet = new Set(accessIds);
  const allGroups = Array.isArray(groups) ? groups : [];
  return allGroups
    .filter((group) => group && scopeSet.has(group.id))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

/**
 * True iff `groupId` is within the user's access scope. (Req 2.5, 2.6)
 */
export function isAccessible(user, groupId) {
  const accessIds = user && Array.isArray(user.accessGroupIds) ? user.accessGroupIds : [];
  return accessIds.includes(groupId);
}

/**
 * Truncate a display string to `maxLen` chars, appending a single-character
 * ellipsis ("…") if and only if `name` is longer than `maxLen`. When `name`
 * is at most `maxLen` characters, it is returned unchanged. Never emits more
 * than `maxLen` original characters before the ellipsis. (Req 3.2, 4.1)
 */
export function truncateName(name, maxLen) {
  if (name.length <= maxLen) {
    return name;
  }
  return name.slice(0, maxLen) + '…';
}

/**
 * Normalize a member's availability to exactly one of 'Active' or 'Inactive'.
 * Returns 'Active' only when the member's `availabilityStatus` is exactly the
 * valid value 'Active'; any missing, null, or unrecognized status (including
 * 'Inactive') yields 'Inactive'. Always returns exactly one of the two values.
 * (Req 5.1, 5.3, 5.4)
 */
export function normalizeStatus(member) {
  return member && member.availabilityStatus === 'Active' ? 'Active' : 'Inactive';
}

/**
 * Maximum number of member entries rendered in the group detail view. (Req 4.3)
 */
const MAX_MEMBERS = 500;

/**
 * Build the detail view model for a group's detail view.
 *
 * Returns an object of shape:
 *   {
 *     id: string,
 *     name: string,              // raw group name (view applies 100-char truncation)
 *     leaderId: string,
 *     members: Array<{
 *       id: string,
 *       displayName: string,
 *       availabilityStatus: 'Active' | 'Inactive',   // via normalizeStatus
 *       isLeader: boolean,
 *       inactiveUntil: string | null | undefined    // passthrough of member.inactiveUntil
 *     }>
 *   }
 *
 * - Member order is preserved and the entries are capped at min(memberCount, 500). (Property 5)
 * - Exactly one entry is marked isLeader:true — the member whose id matches
 *   `group.leaderId` — and all others are isLeader:false. (Property 4)
 * - Every entry carries a normalized availability status of 'Active' or
 *   'Inactive'. (Property 7)
 * (Req 4.2, 4.3, 4.4, 5.5)
 */
export function buildGroupDetail(group) {
  const rawMembers = group && Array.isArray(group.members) ? group.members : [];
  const leaderId = group ? group.leaderId : undefined;

  const members = rawMembers.slice(0, MAX_MEMBERS).map((member) => ({
    id: member ? member.id : undefined,
    displayName: member ? member.displayName : undefined,
    availabilityStatus: normalizeStatus(member),
    isLeader: !!member && member.id === leaderId,
    inactiveUntil: member ? member.inactiveUntil : undefined,
  }));

  return {
    id: group ? group.id : undefined,
    name: group ? group.name : undefined,
    leaderId,
    members,
  };
}
