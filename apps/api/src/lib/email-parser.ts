import { JSDOM } from "jsdom";

export interface ParsedNewsletter {
  cleanText: string;
  wordCount: number;
}

// Selectors for noise elements that should be stripped before extracting text.
const NOISE_SELECTORS: string[] = [
  "script",
  "style",
  "svg",
  // Tracking pixels: 1x1 images
  'img[width="1"]',
  'img[height="1"]',
];

// Attribute-based patterns for elements that should be removed (class or id).
const NOISE_ATTR_PATTERNS: RegExp[] = [
  /unsubscribe/i,
  /footer/i,
  /social/i,
  /tracking/i,
  /advertisement/i,
  /sponsor/i,
  /\bad-/i,   // "ad-" prefix, word-boundary on left
];

// Anchor text patterns — links whose visible text matches are removed.
const NOISE_LINK_TEXT_PATTERNS: RegExp[] = [
  /unsubscribe/i,
  /manage\s+preferences/i,
  /view\s+in\s+browser/i,
];

/**
 * Return true if the element has a class or id attribute matching any noise
 * pattern. Checks space-separated class tokens individually so a class like
 * "footer-legal" is matched by /footer/i.
 */
function hasNoiseAttribute(el: Element): boolean {
  const classAttr = el.getAttribute("class") ?? "";
  const idAttr = el.getAttribute("id") ?? "";

  return NOISE_ATTR_PATTERNS.some((pattern) => {
    if (pattern.test(idAttr)) return true;
    // Test each class token so partial-substring matches work reliably.
    return classAttr.split(/\s+/).some((cls) => pattern.test(cls));
  });
}

/**
 * Collect all elements matching noise criteria into a set, then remove them
 * from the document in a single pass (avoids live-NodeList mutation issues).
 */
function removeNoiseElements(document: Document): void {
  const toRemove = new Set<Element>();

  // 1. Tag / attribute selector based noise
  NOISE_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => toRemove.add(el));
  });

  // 2. Class/id pattern based noise — walk all elements once
  document.querySelectorAll("*").forEach((el) => {
    if (hasNoiseAttribute(el)) toRemove.add(el);
  });

  // 3. Links whose visible text contains noise phrases
  document.querySelectorAll("a").forEach((anchor) => {
    const text = anchor.textContent ?? "";
    if (NOISE_LINK_TEXT_PATTERNS.some((pattern) => pattern.test(text))) {
      toRemove.add(anchor);
    }
  });

  toRemove.forEach((el) => el.parentNode?.removeChild(el));
}

/**
 * Pick the most semantically meaningful container element, falling back to
 * body if no well-known content landmark is found.
 */
function selectContentRoot(document: Document): Element {
  const candidates = [
    "article",
    "main",
    '[class*="post-content"]',
    '[class*="entry-content"]',
    '[class*="email-body"]',
    '[class*="content"]',
  ];

  for (const selector of candidates) {
    const el = document.querySelector(selector);
    if (el) return el;
  }

  return document.body ?? document.documentElement;
}

/**
 * Collapse irregular whitespace in the extracted text:
 * - Normalise all whitespace runs (spaces, tabs) to a single space per run.
 * - Collapse sequences of more than two consecutive newlines to exactly two.
 * - Trim leading/trailing whitespace.
 */
function normaliseWhitespace(raw: string): string {
  return raw
    // Replace horizontal whitespace runs with a single space
    .replace(/[^\S\n]+/g, " ")
    // Collapse 3+ consecutive newlines (with optional surrounding spaces) to two
    .replace(/(\s*\n){3,}/g, "\n\n")
    .trim();
}

/**
 * Count words in a cleaned text string.
 * Splits on whitespace boundaries and filters empty tokens.
 */
function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((token) => token.length > 0).length;
}

/**
 * Parse a newsletter HTML string and return the cleaned plain text together
 * with its word count.
 *
 * @param html - Raw HTML from the email body.
 * @returns An object containing `cleanText` and `wordCount`.
 */
export function parseNewsletterHtml(html: string): ParsedNewsletter {
  if (!html || html.trim().length === 0) {
    return { cleanText: "", wordCount: 0 };
  }

  const dom = new JSDOM(html);

  const { document } = dom.window;

  // Strip noise elements before extracting text.
  removeNoiseElements(document);

  // Pick the best content root.
  const contentRoot = selectContentRoot(document);

  // Extract raw text content and normalise whitespace.
  const rawText = contentRoot.textContent ?? "";
  const cleanText = normaliseWhitespace(rawText);
  const wordCount = countWords(cleanText);

  return { cleanText, wordCount };
}
