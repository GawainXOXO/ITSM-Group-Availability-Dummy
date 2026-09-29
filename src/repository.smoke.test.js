// repository.smoke.test.js — smoke test for successful demo-data load (task 3.4).
// Asserts loadDemoData() (called with no arguments, using the real predefined
// dataset) returns a valid, fully populated dataset. This is a one-shot
// assertion over fixed data (not a fast-check property test), per the design's
// Testing Strategy "Smoke Tests" section.
//
// Validates: Requirements 6.1

import { describe, it, expect } from 'vitest';
import { loadDemoData } from './repository.js';

describe('loadDemoData() successful load smoke test', () => {
  it('returns a valid, fully populated dataset with exactly three users', () => {
    const result = loadDemoData();

    // Req 6.1: the demonstration data loads successfully.
    expect(result.ok).toBe(true);

    // Exactly three predefined users.
    expect(Array.isArray(result.users)).toBe(true);
    expect(result.users).toHaveLength(3);

    // Groups are present and non-empty.
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.groups.length).toBeGreaterThan(0);

    // Light sanity check: every group is fully populated with a leader present
    // among its members and at least 2 members total.
    for (const group of result.groups) {
      expect(Array.isArray(group.members)).toBe(true);
      expect(group.members.length).toBeGreaterThanOrEqual(2);

      const leader = group.members.find((m) => m.id === group.leaderId);
      expect(leader).toBeDefined();
    }
  });
});
