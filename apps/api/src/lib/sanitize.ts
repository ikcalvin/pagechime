/**
 * Strips PostgREST filter operators and other dangerous characters from
 * user-supplied search terms to prevent query injection via .ilike().
 * Also enforces a maximum length.
 */
export function sanitizeSearchTerm(raw: string): string {
  const MAX_SEARCH_LENGTH = 200;
  // Remove SQL LIKE wildcards, escape char, PostgREST operators, and backtick
  const sanitized = raw
    .replace(/[%_\\]/g, "") // SQL LIKE wildcards and escape char
    .replace(/[(),.!\`]/g, "") // PostgREST operator chars + backtick (not operator)
    .trim();
  return sanitized.slice(0, MAX_SEARCH_LENGTH);
}
