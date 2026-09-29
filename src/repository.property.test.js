// repository.property.test.js — property-based tests for the repository's
// data validation (src/repository.js). Uses Vitest + fast-check per the
// design's Testing Strategy.
//
// Implements task 3.2 (Property 10).

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateDemoData } from './repository.js';

// A fixed, always-valid three-user baseline. The user portion of the dataset
// satisfies every user-side invariant (exactly 3 users; scope sizes {2,1,0};
// required named groups in the correct scopes), so the ONLY thing that can
// drive validity in these tests is the structure of the groups we supply.
function baselineUsers() {
  return [
    { id: 'user-alex', label: 'Alex Morgan', accessGroupIds: ['cyber-security', 'data-center'] },
    { id: 'user-priya', label: 'Priya Nair', accessGroupIds: ['lead-network'] },
    { id: 'user-sam', label: 'Sam Ito', accessGroupIds: [] },
  ];
}

// Build a structurally valid group with the given id/name: exactly one leader
// (leaderId matches a member) and `additional` extra members (1..20 keeps it
// in range). Every member has a valid availabilityStatus so only the group's
// leader/size structure is under test.
function validGroup(id, name, additional = 2) {
  const members = [{ id: `${id}-lead`, displayName: `${name} Lead`, availabilityStatus: 'Active' }];
  for (let i = 0; i < additional; i++) {
    members.push({
      id: `${id}-m${i}`,
      displayName: `${name} Member ${i}`,
      availabilityStatus: i % 2 === 0 ? 'Active' : 'Inactive',
    });
  }
  return { id, name, leaderId: `${id}-lead`, members };
}

// The three required named groups (always valid) that satisfy the user-scope
// invariants. The test then appends one additional, generator-controlled group.
function requiredGroups() {
  return [
    validGroup('cyber-security', 'Cyber Security', 3),
    validGroup('data-center', 'Data Center', 2),
    validGroup('lead-network', 'Lead Network', 2),
  ];
}

// Feature: group-availability-mockup, Property 10: Group structure validation — validateDemoData accepts a group only if it has exactly one leader (a member matching leaderId) and a total member count between 2 and 21 inclusive (1 leader + 1..20 additional members); a group violating either condition is rejected.
// Validates: Requirements 6.4
describe('Property 10: Group structure validation', () => {
  it('accepts a group iff it has exactly one leader match and 2..21 total members', () => {
    fc.assert(
      fc.property(
        // memberCount: total members in the extra group (0..25 spans below,
        // at, and above the [2,21] range).
        fc.integer({ min: 0, max: 25 }),
        // leaderMatches: how many members share the id referenced by leaderId
        // (0 = no leader match, 1 = valid, 2+ = ambiguous/too many leaders).
        fc.integer({ min: 0, max: 3 }),
        (memberCount, leaderMatches) => {
          const gid = 'extra-group';
          const leaderMemberId = `${gid}-leader`;

          // Build `memberCount` members, all with a valid status. The first
          // `leaderMatches` of them are given the leader id so we can control
          // exactly how many members match leaderId.
          const members = [];
          for (let i = 0; i < memberCount; i++) {
            members.push({
              id: i < leaderMatches ? leaderMemberId : `${gid}-m${i}`,
              displayName: `Extra Member ${i}`,
              availabilityStatus: i % 2 === 0 ? 'Active' : 'Inactive',
            });
          }

          const extraGroup = { id: gid, name: 'Extra Group', leaderId: leaderMemberId, members };
          const groups = [...requiredGroups(), extraGroup];

          const { valid } = validateDemoData(baselineUsers(), groups);

          // The extra group is well-formed iff it has exactly one leader match
          // AND its total member count is within [2, 21]. Since the baseline
          // users and required groups are always valid, overall validity must
          // exactly track the extra group's structural correctness.
          const hasExactlyOneLeader = leaderMatches === 1;
          const sizeInRange = memberCount >= 2 && memberCount <= 21;
          const expectedValid = hasExactlyOneLeader && sizeInRange;

          expect(valid).toBe(expectedValid);
        }
      ),
      { numRuns: 200 }
    );
  });
});
