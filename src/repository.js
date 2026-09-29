// repository.js — loads and validates the demo data at startup.
// Implements task 3.1. Enforces the Req 6 data invariants (design.md
// "Data Invariants (validated at load — Req 6)").

import { users, groups } from './data.js';

const VALID_STATUSES = new Set(['Active', 'Inactive']);

// Named groups that must exist within specific access scopes (Req 6.2, 6.3).
const REQUIRED_TWO_GROUP_SCOPE = ['cyber-security', 'data-center'];
const REQUIRED_ONE_GROUP_SCOPE = ['lead-network'];

/**
 * Validate the demonstration dataset against the Req 6 invariants.
 *
 * Invariants enforced (design.md):
 *  1. Exactly three users exist. (6.1)
 *  2. Each user's `accessGroupIds` is a defined array. (6.1)
 *  3. Scope distribution across the three users is exactly {2, 1, 0}. (2.1)
 *  4. `cyber-security` + `data-center` are the two-group user's scope; and
 *     `lead-network` is the one-group user's scope. (6.2, 6.3)
 *  5. Every group has exactly one leader (`leaderId` present and matching a
 *     member in `members`). (6.4)
 *  6. Every group has 2–21 total members (1 leader + 1..20 additional). (6.4)
 *  7. Every member has `availabilityStatus ∈ {Active, Inactive}`. (6.5)
 *  8. Every group id referenced by a user's `accessGroupIds` resolves to a
 *     group present in the `groups` array (no dangling references). (6.6)
 *
 * @param {Array} rawUsers
 * @param {Array} rawGroups
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDemoData(rawUsers = users, rawGroups = groups) {
  const errors = [];

  // --- Users ---------------------------------------------------------------
  if (!Array.isArray(rawUsers)) {
    errors.push('users must be an array');
  } else {
    // Invariant 1: exactly three users. (6.1)
    if (rawUsers.length !== 3) {
      errors.push(`expected exactly 3 users, found ${rawUsers.length}`);
    }

    // Invariant 2: each user has a defined accessGroupIds array. (6.1)
    rawUsers.forEach((user, i) => {
      if (!user || typeof user.id !== 'string' || user.id.length === 0) {
        errors.push(`user at index ${i} is missing a valid id`);
      }
      if (!Array.isArray(user?.accessGroupIds)) {
        errors.push(
          `user "${user?.id ?? i}" is missing a defined accessGroupIds array`
        );
      }
    });

    // Invariant 3: scope distribution is exactly {2, 1, 0}. (2.1)
    if (rawUsers.length === 3 && rawUsers.every((u) => Array.isArray(u?.accessGroupIds))) {
      const scopeSizes = rawUsers.map((u) => u.accessGroupIds.length).sort((a, b) => a - b);
      if (!(scopeSizes[0] === 0 && scopeSizes[1] === 1 && scopeSizes[2] === 2)) {
        errors.push(
          `expected user scope sizes of {0, 1, 2}, found {${scopeSizes.join(', ')}}`
        );
      }

      // Invariant 4: required named groups in the correct scopes. (6.2, 6.3)
      const twoGroupUser = rawUsers.find((u) => u.accessGroupIds.length === 2);
      const oneGroupUser = rawUsers.find((u) => u.accessGroupIds.length === 1);

      if (twoGroupUser) {
        const scope = [...twoGroupUser.accessGroupIds].sort();
        const expected = [...REQUIRED_TWO_GROUP_SCOPE].sort();
        if (scope.length !== expected.length || scope.some((id, idx) => id !== expected[idx])) {
          errors.push(
            `two-group user's scope must be exactly [${REQUIRED_TWO_GROUP_SCOPE.join(', ')}], ` +
              `found [${twoGroupUser.accessGroupIds.join(', ')}]`
          );
        }
      }

      if (oneGroupUser) {
        const scope = oneGroupUser.accessGroupIds;
        if (scope.length !== 1 || scope[0] !== REQUIRED_ONE_GROUP_SCOPE[0]) {
          errors.push(
            `one-group user's scope must be exactly [${REQUIRED_ONE_GROUP_SCOPE.join(', ')}], ` +
              `found [${scope.join(', ')}]`
          );
        }
      }
    }
  }

  // --- Groups --------------------------------------------------------------
  if (!Array.isArray(rawGroups)) {
    errors.push('groups must be an array');
  } else {
    rawGroups.forEach((group, i) => {
      const label = group?.id ?? `index ${i}`;

      if (!group || typeof group.id !== 'string' || group.id.length === 0) {
        errors.push(`group at index ${i} is missing a valid id`);
        return;
      }
      if (typeof group.name !== 'string' || group.name.length === 0) {
        errors.push(`group "${label}" is missing a valid name`);
      }
      if (!Array.isArray(group.members)) {
        errors.push(`group "${label}" is missing a members array`);
        return;
      }

      // Invariant 6: 2–21 total members (1 leader + 1..20 additional). (6.4)
      if (group.members.length < 2 || group.members.length > 21) {
        errors.push(
          `group "${label}" must have 2–21 members, found ${group.members.length}`
        );
      }

      // Invariant 5: exactly one leader matching a member in `members`. (6.4)
      if (typeof group.leaderId !== 'string' || group.leaderId.length === 0) {
        errors.push(`group "${label}" is missing a valid leaderId`);
      } else {
        const leaderMatches = group.members.filter((m) => m?.id === group.leaderId);
        if (leaderMatches.length === 0) {
          errors.push(
            `group "${label}" leaderId "${group.leaderId}" does not match any member`
          );
        } else if (leaderMatches.length > 1) {
          errors.push(
            `group "${label}" has ${leaderMatches.length} members matching leaderId "${group.leaderId}" (expected exactly 1)`
          );
        }
      }

      // Invariant 7: every member has a valid availabilityStatus. (6.5)
      group.members.forEach((member, mi) => {
        if (!member || typeof member.id !== 'string' || member.id.length === 0) {
          errors.push(`group "${label}" member at index ${mi} is missing a valid id`);
        }
        if (!VALID_STATUSES.has(member?.availabilityStatus)) {
          errors.push(
            `group "${label}" member "${member?.id ?? mi}" has invalid availabilityStatus ` +
              `"${member?.availabilityStatus}" (expected Active or Inactive)`
          );
        }
      });
    });
  }

  // --- Referential integrity ----------------------------------------------
  // Invariant 8: every group id referenced by a user's accessGroupIds must
  // resolve to a group present in the groups array. Removing a required group
  // (e.g. "cyber-security") leaves a dangling reference, which must be
  // rejected so the app renders no partial group content. (6.6)
  if (Array.isArray(rawUsers) && Array.isArray(rawGroups)) {
    const existingGroupIds = new Set(
      rawGroups
        .filter((g) => g && typeof g.id === 'string' && g.id.length > 0)
        .map((g) => g.id)
    );

    rawUsers.forEach((user, i) => {
      if (!Array.isArray(user?.accessGroupIds)) return;
      user.accessGroupIds.forEach((groupId) => {
        if (!existingGroupIds.has(groupId)) {
          errors.push(
            `user "${user?.id ?? i}" references group "${groupId}" which is not present in the groups array`
          );
        }
      });
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Load the demonstration data.
 *
 * Validates the dataset once at init. When valid, returns the users and groups;
 * when invalid, returns an error so the app can render the "demonstration data
 * failed to load" indicator with no partial group content (Req 6.6).
 *
 * `simulateFailure` is an injectable flag so the load-error UI can be
 * demonstrated later without corrupting the real dataset.
 *
 * @param {Array} [rawUsers=users]
 * @param {Array} [rawGroups=groups]
 * @param {{ simulateFailure?: boolean }} [options]
 * @returns {{ ok: true, users: Array, groups: Array } | { ok: false, error: string }}
 */
export function loadDemoData(rawUsers = users, rawGroups = groups, options = {}) {
  const { simulateFailure = false } = options;

  if (simulateFailure) {
    return { ok: false, error: 'Demonstration data failed to load' };
  }

  const { valid, errors } = validateDemoData(rawUsers, rawGroups);
  if (!valid) {
    return {
      ok: false,
      error: `Demonstration data failed to load: ${errors.join('; ')}`,
    };
  }

  return { ok: true, users: rawUsers, groups: rawGroups };
}
