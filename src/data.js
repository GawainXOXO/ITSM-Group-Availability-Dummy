// data.js — predefined in-memory demonstration data (Users, Groups, Members).
// Pure data, no logic. Satisfies Requirements 2.1, 6.1, 6.2, 6.3, 6.4, 6.5.
//
// Types (see design.md "Data Models"):
//   @typedef {'Active' | 'Inactive'} AvailabilityStatus
//   @typedef {Object} Member { id: string, displayName: string, availabilityStatus: AvailabilityStatus }
//   @typedef {Object} Group  { id: string, name: string, leaderId: string, members: Member[] }
//   @typedef {Object} User   { id: string, label: string, accessGroupIds: string[] }

/**
 * The three predefined demo users with distinct access scopes.
 *  - Alex Morgan : two groups (cyber-security, data-center)
 *  - Priya Nair  : one group  (lead-network)
 *  - Sam Ito     : zero groups (Empty_State)
 * @type {Array<import('./types').User>}
 */
export const users = [
  {
    id: 'user-alex',
    label: 'Alex Morgan',
    accessGroupIds: ['cyber-security', 'data-center'],
  },
  {
    id: 'user-priya',
    label: 'Priya Nair',
    accessGroupIds: ['lead-network'],
  },
  {
    id: 'user-sam',
    label: 'Sam Ito',
    accessGroupIds: [],
  },
];

/**
 * The demonstration groups. Each group has exactly one leader (referenced by
 * `leaderId` and present in `members`) plus 1–20 additional members, with a
 * mix of Active / Inactive availability statuses.
 *
 * `restricted-ops` is intentionally NOT within any user's access scope, so a
 * manually entered detail URL exercises the access-guard edge case (Req 2.5).
 * @type {Array<import('./types').Group>}
 */
export const groups = [
  {
    id: 'cyber-security',
    name: 'Cyber Security',
    leaderId: 'm-cs-lead',
    members: [
      { id: 'm-cs-lead', displayName: 'Dana Whitfield', availabilityStatus: 'Active' },
      { id: 'm-cs-1', displayName: 'Marcus Lee', availabilityStatus: 'Active' },
      { id: 'm-cs-2', displayName: 'Yuki Tanaka', availabilityStatus: 'Inactive', inactiveUntil: 'Today, 4:30 PM' },
      { id: 'm-cs-3', displayName: 'Fatima Nasser', availabilityStatus: 'Active' },
      { id: 'm-cs-4', displayName: 'Owen Brooks', availabilityStatus: 'Inactive', inactiveUntil: 'Tomorrow, 9:00 AM' },
      { id: 'm-cs-5', displayName: 'Lena Petrova', availabilityStatus: 'Active' },
    ],
  },
  {
    id: 'data-center',
    name: 'Data Center',
    leaderId: 'm-dc-lead',
    members: [
      { id: 'm-dc-lead', displayName: 'Grace Oduya', availabilityStatus: 'Active' },
      { id: 'm-dc-1', displayName: 'Tomás Herrera', availabilityStatus: 'Inactive', inactiveUntil: 'Mon, Mar 18' },
      { id: 'm-dc-2', displayName: 'Anika Rao', availabilityStatus: 'Active' },
      { id: 'm-dc-3', displayName: 'Elias Fischer', availabilityStatus: 'Active' },
      { id: 'm-dc-4', displayName: 'Sofia Marino', availabilityStatus: 'Inactive', inactiveUntil: 'Back in 30 min' },
    ],
  },
  {
    id: 'lead-network',
    name: 'Lead Network',
    leaderId: 'm-ln-lead',
    members: [
      { id: 'm-ln-lead', displayName: 'Priya Nair', availabilityStatus: 'Active' },
      { id: 'm-ln-1', displayName: 'Carlos Mendez', availabilityStatus: 'Active' },
      { id: 'm-ln-2', displayName: 'Hannah Berg', availabilityStatus: 'Inactive', inactiveUntil: 'Next Monday' },
      { id: 'm-ln-3', displayName: 'Ravi Kapoor', availabilityStatus: 'Active' },
    ],
  },
  {
    // Not in any user's access scope — exercises the access-guard edge case (Req 2.5).
    id: 'restricted-ops',
    name: 'Restricted Operations',
    leaderId: 'm-ro-lead',
    members: [
      { id: 'm-ro-lead', displayName: 'Nadia Petrov', availabilityStatus: 'Active' },
      { id: 'm-ro-1', displayName: 'Victor Cho', availabilityStatus: 'Inactive', inactiveUntil: 'Today, 4:30 PM' },
    ],
  },
];
