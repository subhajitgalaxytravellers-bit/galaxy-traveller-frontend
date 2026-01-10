import client from "@/api/client";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

export async function getTours() {
  const res = await fetch(`${API_BASE}/api/tour`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data?.items || [];
}

export async function getTour(slug) {
  const res = await fetch(`${API_BASE}/api/tour/${slug}`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data || null;
}

export async function getSearchTours(params = {}) {
  const qs = new URLSearchParams();

  // TEXT SEARCH
  if (params.q && params.q.trim() !== "") {
    qs.append("q", params.q.trim());
  }

  // TOUR TYPE (multi-select)
  if (Array.isArray(params.tourType) && params.tourType.length > 0) {
    params.tourType.forEach((t) => qs.append("tourType", t));
  }

  // DURATION FILTER (multi-select)
  if (Array.isArray(params.duration) && params.duration.length > 0) {
    params.duration.forEach((d) => qs.append("duration", d));
  }

  // RATING FILTER (multi-select)
  if (Array.isArray(params.minRating) && params.minRating.length > 0) {
    params.minRating.forEach((r) => qs.append("minRating", r));
  }

  // PRICE RANGE
  if (typeof params.minPrice === "number" && params.minPrice > 0) {
    qs.append("minPrice", params.minPrice);
  }
  if (typeof params.maxPrice === "number" && params.maxPrice < 30000) {
    qs.append("maxPrice", params.maxPrice);
  }

  // PAGINATION
  if (params.page) qs.append("page", params.page);
  if (params.limit) qs.append("limit", params.limit);

  const res = await client.get(`/tour/search?${qs.toString()}`);

  return (
    res?.data?.data || {
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
    }
  );
}
