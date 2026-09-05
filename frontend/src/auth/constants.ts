/** What an account form accepts.
 *
 * The handle pattern is the database's own, repeated here so a rejection happens
 * while somebody is typing rather than after they submit.
 */

/**
 * The pattern from the profiles table's check constraint.
 *
 * It is repeated here so somebody choosing a handle is told immediately rather than
 * after a round trip, and the two must stay in step: the database is the authority
 * and this is only a courtesy.
 */
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}$/;

export const MIN_PASSWORD_LENGTH = 8;
