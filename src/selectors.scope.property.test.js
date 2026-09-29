// selectors.scope.property.test.js — property-based test for the scoped,
// sorted group list selector (`groupsInScope`).
//
// Validates: Requirements 2.2, 2.3, 2.6, 3.1

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { groupsInScope } from './selectors.js';

describe('groupsInScope — property-based', () => {
  // Feature: group-availability-mockup, Property 1: Scoped group list is correct and alphabetically sorted
  it('returns exactly the in-scope groups (no extras, no omissions), sorted ascending by name', () => {
    // A group id is a unique key; a group also has an arbitrary display name.
    const groupArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 12 }),
      name: fc.string({ maxLength: 40 }),
    });

    fc.assert(
      fc.property(
        // Generate a set of groups with UNIQUE ids so scope membership is
        // unambiguous (id is the scope key).
        fc.uniqueArray(groupArb, {
          selector: (g) => g.id,
          maxLength: 15,
        }),
        // Independent pool of ids that are NOT guaranteed to exist among the
        // groups; used to occasionally include out-of-scope/non-existent ids.
        fc.array(fc.string({ minLength: 1, maxLength: 12 }), { maxLength: 8 }),
        // A fraction used to select which subset of existing group ids are in scope.
        fc.array(fc.boolean(), { maxLength: 15 }),
        (groups, extraIds, includeFlags) => {
          const existingIds = groups.map((g) => g.id);

          // Build accessGroupIds: a subset of existing ids (chosen via flags)
          // plus some ids that may not exist among the groups.
          const chosenExisting = existingIds.filter((_, i) => includeFlags[i % (includeFlags.length || 1)]);
          const accessGroupIds = [...chosenExisting, ...extraIds];
          const user = { id: 'u', label: 'U', accessGroupIds };

          const result = groupsInScope(user, groups);

          const existingIdSet = new Set(existingIds);
          const accessSet = new Set(accessGroupIds);

          // Expected id set = intersection of accessGroupIds and existing group ids.
          const expectedIdSet = new Set(existingIds.filter((id) => accessSet.has(id)));

          const resultIds = result.map((g) => g.id);
          const resultIdSet = new Set(resultIds);

          // (a) No duplicates in the result.
          expect(resultIds.length).toBe(resultIdSet.size);

          // (b) Result id set equals the expected intersection: every returned
          //     group is in scope, and every in-scope group is present — no
          //     extras, no omissions. (Req 2.2, 2.3, 2.6)
          expect(resultIdSet).toEqual(expectedIdSet);

          // (c) Every returned group is a real group from the input (by identity),
          //     confirming no fabricated entries and that ids not present among
          //     the groups (extraIds) are simply ignored.
          for (const g of result) {
            expect(existingIdSet.has(g.id)).toBe(true);
            expect(groups).toContain(g);
          }

          // (d) The result is sorted ascending alphabetically by name, using the
          //     same comparison the implementation uses (localeCompare).
          //     Asserting pairwise non-decreasing order is robust. (Req 3.1)
          for (let i = 1; i < result.length; i++) {
            expect(
              String(result[i - 1].name).localeCompare(String(result[i].name))
            ).toBeLessThanOrEqual(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
