import * as ipaddr from 'ipaddr.js';

/**
 * URL sanitization helper (defense-in-depth against JS/data/blob/ssrf-ish inputs)
 * Validates and sanitizes URLs to prevent SSRF attacks
 * 
 * @param input - The URL string to validate and sanitize
 * @returns Sanitized URL string or null if invalid
 */
export function sanitizeHttpUrl(input: string | undefined): string | null {
  if (!input) return null;
  const candidate = input.trim();
  if (candidate.length === 0 || candidate.length > 2048) return null;
  
  try {
    const url = new URL(candidate);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    
    // Block URLs with credentials
    if (url.username || url.password) return null;
    
    const hostname = url.hostname;
    
    // If hostname is an IP, block private/loopback/link-local
    if (ipaddr.isValid(hostname)) {
      const addr = ipaddr.parse(hostname);
      const rng = addr.range();
      if (rng === 'private' || rng === 'loopback' || rng === 'linkLocal' || rng === 'uniqueLocal') return null;
    } else {
      // Block common local hostnames
      const lower = hostname.toLowerCase();
      if (lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal')) return null;
    }
    
    // Clean up URL
    url.hash = '';
    if (url.search === '?') url.search = '';
    
    return url.toString();
  } catch {
    return null;
  }
}
