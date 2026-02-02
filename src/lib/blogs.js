const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

export async function getAllBlogs() {
  const res = await fetch(`${API_BASE}/api/blog`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  /* 
     We map explicitly to REMOVE 'body' and other heavy unused fields. 
     This dramatically reduces the JSON payload size for the list page.
  */
  const result = json.data.items.map(({
    _id,
    title,
    slug,
    // description, // Removed: potential duplicate of bodyAlt/excerpt
    // body,        // Removed: HEAVY content, not needed for list
    author,
    // createdBy,   // Removed: technical field
    // status,      // Removed: technical field
    // tagMonths,   // Removed: unused
    updatedAt,
    displayImg,
    category,       // Added: needed for badge
    readTime,       // Added: needed for card
    bodyAlt         // Added: used as excerpt
  }) => ({
    _id,
    title,
    slug,
    author,
    updatedAt,
    displayImg,
    category,
    readTime,
    bodyAlt
  }));

  console.log("Optimized Payload Count:", result.length); // useful log, but small info
  return result;
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
