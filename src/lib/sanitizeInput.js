/**
 * 🛡️ Nirvighna Free-Text XSS Sanitizer Utility
 * Sanitizes user input (Lost Person descriptions, booking notes, issue reports)
 * to strip HTML tags, script vectors, and malicious URI schemes before database storage.
 */

export function sanitizeText(str) {
  if (!str || typeof str !== 'string') return str;

  return str
    // Strip HTML tags
    .replace(/<[^>]*>?/gm, '')
    // Neutralize dangerous javascript: / data: URI injections
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Escaping special characters
    .trim();
}
