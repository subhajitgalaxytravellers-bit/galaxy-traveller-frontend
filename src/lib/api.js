const BASE_URL = `${(process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '')}/api`;

/**
 * Industry-standard safe fetch: returns parsed JSON or null on any error.
 * Never throws — callers must check for null.
 */
export async function fetchJSON(endpoint, { cache = 'no-store', next } = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { cache, next });
    if (!res.ok) {
      console.warn(`[API] ${endpoint} → ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.warn(`[API] ${endpoint} → network error`, err?.message);
    return null;
  }
}
