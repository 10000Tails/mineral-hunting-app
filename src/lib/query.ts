/**
 * Builds a query string without URLSearchParams, whose React Native
 * implementation has historically been incomplete.
 */
export function toQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}
