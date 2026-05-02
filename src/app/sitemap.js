import { getAllDestinations } from '@/lib/destinations';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://traveltailor.in';

  // Fetch dynamic destinations
  let destinations = [];
  try {
    const data = await getAllDestinations();
    destinations =
      data?.data?.group?.flatMap((g) => g.destinations)?.filter(Boolean) || [];
  } catch (e) {
    console.error('Sitemap fetch failed:', e);
  }

  const destinationUrls = destinations.map((d) => ({
    url: `${baseUrl}/destination/${d.slug}`,
    lastModified: new Date().toISOString(),
  }));

  const staticUrls = [
    '',
    '/destinations',
    '/tours',
    '/blogs',
    '/contact',
    '/about',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date().toISOString(),
  }));

  return [...staticUrls, ...destinationUrls];
}
