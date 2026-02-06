import client from "@/api/client";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

// Server-friendly paginated fetch (uses fetch to avoid browser-only APIs)
export async function getBlogsPage({ page = 1, limit = 9, q = "" } = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (q?.trim()) params.append("q", q.trim());

  const res = await fetch(`${API_BASE}/api/blog?${params.toString()}`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return { items: [], total: 0, page, totalPages: 1, limit };
  }

  const json = await res.json();
  const data =
    json?.data || { items: [], total: 0, page, totalPages: 1, limit };

  const items = (data.items || []).map(
    ({
      _id,
      title,
      slug,
      author,
      updatedAt,
      displayImg,
      category,
      readTime,
      bodyAlt,
    }) => ({
      _id,
      title,
      slug,
      author,
      updatedAt,
      displayImg,
      category,
      readTime,
      bodyAlt,
    })
  );

  return { ...data, items };
}

// Legacy helper: returns first page items array for callers expecting a list
export async function getAllBlogs() {
  const { items } = await getBlogsPage({ page: 1, limit: 50 });
  return items;
}

export async function getBlog(slug) {
  const res = await fetch(`${API_BASE}/api/blog/${slug}`, {
    cache: "force-cache",
    next: { revalidate: 120 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data;
}
