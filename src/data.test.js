// data.test.js — smoke tests for the fixed demonstration dataset.
// Verifies the predefined data in data.js against the invariants that the
// mockup depends on. These are one-shot assertions over fixed data (not
// property tests), per the design's Testing Strategy "Smoke Tests" section.
//
// Validates: Requirements 2.1, 6.1, 6.2, 6.3, 6.5

import { describe, it, expect } from 'vitest';
import { users, groups } from './data.js';

describe('demonstration dataset smoke tests', () => {
  // Req 6.1: exactly three predefined users.
  it('defines exactly three users', () => {
    expect(users).toHaveLength(3);
  });

  // Req 2.1: scope sizes across the three users are exactly {2, 1, 0}.
  it('has access-scope sizes of exactly {2, 1, 0} across users', () => {
    const scopeSizes = users.map((u) => u.accessGroupIds.length).sort((a, b) => a - b);
    expect(scopeSizes).toEqual([0, 1, 2]);
  });

  // Req 6.2: User A (Alex Morgan / user-alex) scope is exactly the two named
  // groups, no others.
  it('gives User A ("Alex Morgan") a scope of exactly ["cyber-security","data-center"]', () => {
    const alex = users.find((u) => u.id === 'user-alex');
    expect(alex).toBeDefined();
    expect(alex.label).toBe('Alex Morgan');
    expect([...alex.accessGroupIds].sort()).toEqual(['cyber-security', 'data-center']);
    expect(alex.accessGroupIds).toHaveLength(2);
  });

  // Req 6.3: User B (Priya Nair / user-priya) scope is exactly ["lead-network"],
  // no others.
  it('gives User B ("Priya Nair") a scope of exactly ["lead-network"]', () => {
    const priya = users.find((u) => u.id === 'user-priya');
    expect(priya).toBeDefined();
    expect(priya.label).toBe('Priya Nair');
    expect(priya.accessGroupIds).toEqual(['lead-network']);
  });

  // Req 6.5: every member across all groups has a status of Active or Inactive,
  // with none left unassigned.
  it('assigns every member a status of "Active" or "Inactive"', () => {
    const allMembers = groups.flatMap((g) => g.members);
    expect(allMembers.length).toBeGreaterThan(0);
    for (const member of allMembers) {
      expect(['Active', 'Inactive']).toContain(member.availabilityStatus);
    }
  });
});
