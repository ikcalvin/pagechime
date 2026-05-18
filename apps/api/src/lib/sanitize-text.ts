// ---------------------------------------------------------------------------
// Post-Readability text sanitization
// ---------------------------------------------------------------------------
// Mozilla Readability strips nav/ads/sidebars but still lets through image
// credits, captions, social sharing text, and other non-article noise that
// sounds jarring when narrated via TTS. This module cleans up that residue.
//
// Used after Readability's textContent extraction, before TTS and DB storage.
// ---------------------------------------------------------------------------

/**
 * Lines matching any of these patterns are removed entirely.
 * Patterns are tested case-insensitively against each line.
 */
const LINE_REMOVAL_PATTERNS: RegExp[] = [
  // Image/photo credits
  /^\s*(image|photo|picture|illustration|graphic|video)\s*(credit|courtesy|source|by|via)\s*[:.]?\s*/i,
  /^\s*credits?\s*[:.]?\s*.+/i,
  /^\s*(©|copyright)\s+/i,

  // Stock photo agency names (standalone lines)
  /^\s*(getty\s*images?|shutterstock|istock|unsplash|pexels|adobe\s*stock|alamy|reuters|ap\s*photo|afp|associated\s*press)/i,

  // Figure/caption markers
  /^\s*(figure|fig\.?|caption)\s*\d*\s*[:.]?\s*/i,

  // Social sharing artifacts
  /^\s*(share|tweet|post|pin)\s+(this|on|to)\s+(twitter|x|facebook|linkedin|pinterest|reddit|email)/i,
  /^\s*(follow|like|subscribe|join)\s+(us\s+)?(on|to|at)\s+/i,
  /^\s*(share|tweet|post)\s*$/i,

  // Newsletter/subscription CTAs
  /^\s*(sign\s*up|subscribe|get\s+this|join\s+our)\s+(for|to)?\s*(our\s+)?(newsletter|mailing\s*list|inbox|email\s*list)/i,
  /^\s*enter\s+your\s+email/i,

  // Ad/promo markers
  /^\s*(advertisement|sponsored(\s+content)?|promoted|ad|paid\s+(content|partnership|post))\s*$/i,
  /^\s*\[ad\]\s*$/i,

  // "Read more" / "Related" / "See also" link blocks
  /^\s*(read\s+more|continue\s+reading|related\s+(articles?|stories|posts?)|see\s+also|more\s+from|recommended)\s*[:.]?\s*$/i,

  // Standalone "Updated" / "Published" timestamps that Readability leaks
  /^\s*(updated|published|posted|modified)\s*[:.]?\s*\w+\s+\d/i,

  // Empty bracket/parenthetical artifacts
  /^\s*[\[\(]\s*[\]\)]\s*$/,
];

/**
 * Inline patterns replaced with empty string (within a line, not whole-line).
 */
const INLINE_REPLACEMENTS: { pattern: RegExp; replacement: string }[] = [
  // Inline image credits: "(Getty Images)", "(Photo: AP)", "[Credit: Reuters]"
  { pattern: /\s*[\(\[]\s*(photo|image|credit|source)\s*[:.]?\s*[^\)\]]*[\)\]]/gi, replacement: "" },
  // Standalone agency names mid-sentence: "...says the report. Getty Images The study..."
  { pattern: /\b(Getty\s*Images?|Shutterstock|iStock|Unsplash|AP\s*Photo|Reuters|AFP)\b/g, replacement: "" },
];

/**
 * Sanitize article text extracted by Readability.
 *
 * Removes image credits, captions, social sharing artifacts, ad markers,
 * and other non-article noise. Collapses excessive whitespace.
 *
 * @param text - Plain text from Readability's textContent
 * @returns Cleaned text ready for TTS and storage
 */
export function sanitizeArticleText(text: string): string {
  if (!text) return "";

  // Split into lines for line-level filtering
  const lines = text.split("\n");

  const cleaned = lines
    .filter((line) => {
      // Keep non-empty lines that don't match any removal pattern
      const trimmed = line.trim();
      if (trimmed.length === 0) return true; // preserve blank lines for now

      return !LINE_REMOVAL_PATTERNS.some((pattern) => pattern.test(trimmed));
    })
    .map((line) => {
      // Apply inline replacements
      let result = line;
      for (const { pattern, replacement } of INLINE_REPLACEMENTS) {
        result = result.replace(pattern, replacement);
      }
      return result;
    })
    .join("\n");

  // Collapse 3+ consecutive newlines into 2 (preserve paragraph breaks)
  return cleaned
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
