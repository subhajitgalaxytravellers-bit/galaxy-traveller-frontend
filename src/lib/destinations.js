import { fetchJSON } from "./api";

/**
 * Fetch all destination groups from site_destinationsList.
 * Used by the Navbar destinations dropdown and the /destinations/[list] page.
 */
export async function getDestinationGroups({ revalidate = 300 } = {}) {
  try {
    const base = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');
    const res = await fetch(`${base}/api/site_destinationsList`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.group || [];
  } catch {
    return [];
  }
}


export async function getAllDestinations() {
  // Primary: curated grouped list used by /destinations page.
  // Keep exact route casing first; some deployments may enforce case-sensitive routing.
  const primary =
    (await fetchJSON("/site_destinationsList", {
      cache: "force-cache",
      next: { revalidate: 60 },
    })) ||
    (await fetchJSON("/site_destinationslist", {
      cache: "force-cache",
      next: { revalidate: 60 },
    }));

  const groups = primary?.data?.group;
  const hasGroupedDestinations =
    Array.isArray(groups) &&
    groups.some(
      (g) => Array.isArray(g?.destinations) && g.destinations.length > 0,
    );

  if (hasGroupedDestinations) return primary;

  // Fallback: directly list published destinations so page never appears empty.
  const fallback = await fetchJSON("/destinations?status=published&limit=500", {
    cache: "no-store",
  });
  const items = Array.isArray(fallback?.data?.items)
    ? fallback.data.items
    : [];

  if (!items.length) {
    return primary || { success: true, data: { group: [] } };
  }

  return {
    success: true,
    data: {
      group: [
        {
          title: "All Destinations",
          destinations: items,
        },
      ],
    },
  };
}

export async function getDestination(slug) {
  return fetchJSON(`/destinations/${slug}`, {
    cache: "no-store", // Always fresh
  });
}
