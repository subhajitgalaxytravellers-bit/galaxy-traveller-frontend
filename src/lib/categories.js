const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');

/**
 * Fetch all published tour-group categories with their child regions.
 * Used by the Navbar mega menu and TourCategories homepage section.
 */
export async function getTourGroups({ revalidate = 300 } = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/categories/tour-groups`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.items || [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single category by tag/slug.
 */
export async function getCategory(tagOrId, { revalidate = 300 } = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/categories/${tagOrId}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

/**
 * Fetch all published tours under a category (including child regions).
 * @param {string} tagOrId - category tag or ObjectId
 * @param {object} params  - { page, limit, q, region } optional filters
 */
export async function getCategoryTours(tagOrId, params = {}) {
  const qs = new URLSearchParams();
  if (params.page)  qs.set('page',  params.page);
  if (params.limit) qs.set('limit', params.limit);
  if (params.q)     qs.set('q',     params.q);

  try {
    const res = await fetch(
      `${API_BASE}/api/categories/${tagOrId}/tours?${qs.toString()}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { items: [], total: 0, totalPages: 1 };
    const json = await res.json();
    return json?.data || { items: [], total: 0, totalPages: 1 };
  } catch {
    return { items: [], total: 0, totalPages: 1 };
  }
}

/**
 * Client-side version (uses fetch directly from browser)
 */
export async function getCategoryToursClient(tagOrId, params = {}) {
  const qs = new URLSearchParams();
  if (params.page)  qs.set('page',  params.page);
  if (params.limit) qs.set('limit', params.limit);
  if (params.q)     qs.set('q',     params.q);

  const res = await fetch(
    `${API_BASE}/api/categories/${tagOrId}/tours?${qs.toString()}`
  );
  if (!res.ok) throw new Error('Failed to fetch tours');
  const json = await res.json();
  return json?.data || { items: [], total: 0, totalPages: 1 };
}
