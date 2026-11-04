import type { Middleware } from 'remix/router'

// ponytail: no script-src/style-src yet. The inline import map, the per-component <style> tags and
// style attributes need nonces or hashes; add them when the asset server can emit a nonce.
const CONTENT_SECURITY_POLICY = [
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ')

const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Browsers ignore it over plain http, so local development is unaffected.
  'Strict-Transport-Security': 'max-age=31536000', // 1 year

  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

/** Adds baseline security headers; a route's own value (such as a stricter referrer policy) wins. */
export function securityHeaders(): Middleware {
  return async (_context, next) => {
    const response = await next()
    const headers = new Headers(response.headers)
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      if (!headers.has(name)) headers.set(name, value)
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}
