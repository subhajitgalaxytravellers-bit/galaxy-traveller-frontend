const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

export async function getAllBlogs() {
  const res = await fetch(`${API_BASE}/api/blog`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data?.items || json?.items || [];
}

export async function getBlog(slug) {
  const res = await fetch(`${API_BASE}/api/blog/${slug}`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data;
}
