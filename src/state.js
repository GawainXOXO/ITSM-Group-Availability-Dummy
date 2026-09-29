// state.js — single in-memory AppState plus sign-in/sign-out mutators.

/**
 * @typedef {Object} Route
 * @property {string} name
 *
 * @typedef {Object} AppState
 * @property {string | null} currentUserId  // id of the signed-in user, or null when signed out
 * @property {Route} route                  // current route descriptor
 * @property {boolean} dataError             // true when demonstration data failed to load
 */

/** @type {AppState} */
export const state = {
  currentUserId: null,
  route: { name: 'login' },
  dataError: false,
};

/**
 * Sign in as userId, replacing any prior identity. (Req 1.6)
 * @param {string} userId
 */
export function signIn(userId) {
  state.currentUserId = userId;
}

/** Clear the signed-in identity. (Req 1.5) */
export function signOut() {
  state.currentUserId = null;
}
