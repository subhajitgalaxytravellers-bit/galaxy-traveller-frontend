import { notFound } from 'next/navigation';
import { getCategory, getTourGroups, getCategoryTours } from '@/lib/categories';
import CategoryPageClient from '@/components/tour/CategoryPageClient';

export async function generateMetadata({ params }) {
  const { category: categoryTag, region: regionTag } = await params;
  const [cat, region] = await Promise.all([
    getCategory(categoryTag),
    getCategory(regionTag),
  ]);
  const catName    = cat?.name    || categoryTag;
  const regionName = region?.name || regionTag;

  return {
    title: `${regionName} Tour Packages | ${catName} | Galaxy Travellers`,
    description:
      region?.description ||
      `Explore our curated ${regionName} tour packages under ${catName}. Find the best itineraries and deals.`,
    openGraph: {
      title: `${regionName} Packages | Galaxy Travellers`,
      images: region?.coverImg
        ? [{ url: region.coverImg, width: 1200, height: 630 }]
        : cat?.coverImg
        ? [{ url: cat.coverImg, width: 1200, height: 630 }]
        : [],
    },
  };
}

export default async function RegionPage({ params }) {
  const { category: categoryTag, region: regionTag } = await params;

  const [cat, regionCat, groups, initialTours] = await Promise.all([
    getCategory(categoryTag),
    getCategory(regionTag),
    getTourGroups(),
    getCategoryTours(regionTag, { page: 1, limit: 12 }),
  ]);

  if (!cat || !regionCat) return notFound();

  // Siblings — other regions under the same group
  const group = groups.find((g) => g.tag === categoryTag);
  const regions = group?.regions || [];

  // Use region data for the hero, fallback to parent category
  const displayCategory = {
    ...cat,
    name: regionCat.name || regionCat.tag,
    description: regionCat.description || cat.description,
    coverImg: regionCat.coverImg || cat.coverImg,
    tag: regionCat.tag,
  };

  return (
    <CategoryPageClient
      category={displayCategory}
      regions={regions}
      initialTours={initialTours}
      regionTag={regionTag}
    />
  );
}
