/**
 * Escapes characters that have special meaning in PostgREST filters.
 * Specifically for the simple pattern matching used in 'ilike' queries.
 */
export const escapeSearchTerm = (term: string): string => {
    return term
        .replace(/\\/g, '\\\\') // Escape backslashes first
        .replace(/%/g, '\\%')   // Escape wildcard
        .replace(/_/g, '\\_')   // Escape wildcard
        .replace(/,/g, '\\,')   // Escape separator
        .replace(/\./g, '\\.')  // Escape path separator? (conservative approach)
        .replace(/\(/g, '\\(')  // Escape logical group start
        .replace(/\)/g, '\\)'); // Escape logical group end
};
