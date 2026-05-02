const BASE = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');

export async function getFlyers({ page = 1, limit = 12 } = {}) {
  try {
    const url = `${BASE}/api/flyers?page=${page}&limit=${limit}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      console.warn('[Flyers] API error:', res.status);
      return { data: null };
    }

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[Flyers] network error:', err?.message);
    return { data: null };
  }
}
