import { getTour } from '@/lib/tours';
import TourPageClient from '@/components/tour/TourDetailsClient';
import toTourModel from '@/lib/mapTourModel'; // move mapper OUT of client
import { notFound } from 'next/navigation';

// ----------------------
// DYNAMIC SEO
// ----------------------
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const apiTour = await getTour(slug);

  if (!apiTour) {
    return {
      title: 'Tour Not Found',
      description: "The tour you're looking for does not exist.",
    };
  }

  const seo = apiTour?.seo || {};
  const title = seo.metaTitle || apiTour.title || 'Tour Details';
  const description = seo.metaDescription || apiTour.brief || '';

  return {
    title,
    description,
    alternates: {
      canonical: `/tour/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: [
        {
          url: seo.shareImage || apiTour.heroImg || '/default-og.jpg',
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [seo.shareImage || apiTour.heroImg || '/default-og.jpg'],
    },
  };
}

// ----------------------
// PAGE SSR
// ----------------------
export default async function Page({ params }) {
  const { slug } = await params;
  const apiTour = await getTour(slug);

  if (!apiTour) return notFound();

  const tour = await toTourModel(apiTour); // MAP ON SERVER
  console.log(apiTour);

  return <TourPageClient tour={tour} />;
}
