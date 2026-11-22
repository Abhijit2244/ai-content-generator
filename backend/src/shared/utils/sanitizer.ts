/**
 * Security Input Sanitizer
 * Strips dangerous HTML injection tags, script vectors, event handlers, and control characters.
 */

// Regex patterns targeting XSS vectors
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const IFRAME_TAG_REGEX = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const OBJECT_TAG_REGEX = /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
const EMBED_TAG_REGEX = /<embed\b[^>]*>/gi;
const EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:[^"'\s]*/gi;
const VBSCRIPT_URI_REGEX = /vbscript\s*:[^"'\s]*/gi;
const DATA_HTML_REGEX = /data\s*:\s*text\/html[^"'\s]*/gi;
const NULL_BYTE_REGEX = /\0/g;

/**
 * Sanitizes user-supplied string by neutralizing XSS vectors and null-byte injection.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(NULL_BYTE_REGEX, '')
    .replace(SCRIPT_TAG_REGEX, '')
    .replace(IFRAME_TAG_REGEX, '')
    .replace(OBJECT_TAG_REGEX, '')
    .replace(EMBED_TAG_REGEX, '')
    .replace(EVENT_HANDLER_REGEX, '')
    .replace(JAVASCRIPT_URI_REGEX, '')
    .replace(VBSCRIPT_URI_REGEX, '')
    .replace(DATA_HTML_REGEX, '');
}

/**
 * Sanitizes an array of string items (e.g. keywords).
 */
export function sanitizeStringArray(items: string[]): string[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => sanitizeString(String(item)).trim()).filter(Boolean);
}
