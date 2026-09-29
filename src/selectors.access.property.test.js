// selectors.access.property.test.js — property-based test for the access predicate.
//
// Validates: Requirements 2.5

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isAccessible } from './selectors.js';

describe('isAccessible — access predicate property', () => {
  // Feature: group-availability-mockup, Property 2: Access predicate matches scope membership
  it('returns true iff groupId is contained in user.accessGroupIds', () => {
    fc.assert(
      fc.property(
        // Arbitrary access scope: a list of group-id strings (may be empty).
        fc.array(fc.string()),
        // A candidate groupId that is sometimes drawn from the scope (true
        // branch) and sometimes an arbitrary string (usually the false branch).
        fc.oneof(fc.string(), fc.string()),
        // Bias: when true, pick the groupId from the scope (if non-empty).
        fc.boolean(),
        (accessGroupIds, randomGroupId, pickFromScope) => {
          const groupId =
            pickFromScope && accessGroupIds.length > 0
              ? accessGroupIds[randomGroupId.length % accessGroupIds.length]
              : randomGroupId;

          const user = { id: 'u', label: 'U', accessGroupIds };

          expect(isAccessible(user, groupId)).toBe(accessGroupIds.includes(groupId));
        }
      ),
      { numRuns: 200 }
    );
  });
});
