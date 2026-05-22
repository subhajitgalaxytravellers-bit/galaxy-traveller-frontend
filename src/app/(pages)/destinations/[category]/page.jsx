import { notFound } from 'next/navigation';
import { getDestinationGroups } from '@/lib/destinations';
import DestinationListPageClient from '@/components/destinations/DestinationListPageClient';

/** Convert a title to a URL slug — must mirror the slugify() in Navbar.jsx */
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateMetadata({ params }) {
  const { category: listSlug } = await params;
  const groups = await getDestinationGroups();
  const group = groups.find((g) => slugify(g.title) === listSlug);
  const name = group?.title || listSlug;

  return {
    title: `${name} Destinations | Galaxy Travellers`,
    description: `Explore our handpicked ${name} destinations. Find tours, pricing, and travel experiences.`,
    openGraph: {
      title: `${name} | Galaxy Travellers`,
      images: group?.coverImg ? [{ url: group.coverImg, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function DestinationListPage({ params }) {
  const { category: listSlug } = await params;

  const groups = await getDestinationGroups({ revalidate: 120 });
  const group = groups.find((g) => slugify(g.title) === listSlug);

  if (!group) return notFound();

  return <DestinationListPageClient group={group} />;
}
