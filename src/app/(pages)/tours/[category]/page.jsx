import { notFound } from 'next/navigation';
import { getCategory, getTourGroups, getCategoryTours } from '@/lib/categories';
import CategoryPageClient from '@/components/tour/CategoryPageClient';

export async function generateMetadata({ params }) {
  const { category: categoryTag } = await params;
  const cat = await getCategory(categoryTag);
  const name = cat?.name || categoryTag;

  return {
    title: `${name} Packages | Galaxy Travellers`,
    description: cat?.description || `Explore our ${name} tour packages with curated itineraries and best prices.`,
    openGraph: {
      title: `${name} | Galaxy Travellers`,
      images: cat?.coverImg ? [{ url: cat.coverImg, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function CategoryPage({ params }) {
  const { category: categoryTag } = await params;

  // Load category + sub-regions + initial tours in parallel
  const [cat, groups, initialTours] = await Promise.all([
    getCategory(categoryTag),
    getTourGroups(),
    getCategoryTours(categoryTag, { page: 1, limit: 12 }),
  ]);

  if (!cat) return notFound();

  // Find child regions for this category
  const group = groups.find((g) => g.tag === categoryTag);
  const regions = group?.regions || [];

  return (
    <CategoryPageClient
      category={cat}
      regions={regions}
      initialTours={initialTours}
      regionTag={null}
    />
  );
}
