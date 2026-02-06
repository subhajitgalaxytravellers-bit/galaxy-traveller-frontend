import DestinationDetailsClient from '@/components/destinations/DestinationDetailsClient';
import { getDestination } from '@/lib/destinations';

// Dynamic SEO for each destination
export async function generateMetadata({ params }) {
  const { slug } = await params; // ← FIX
  console.log(slug);
  const destination = await getDestination(slug);

  if (!destination) {
    return {
      title: 'Destination Not Found',
      description: 'This destination does not exist.',
    };
  }

  const seo = destination.seo || {};

  const title =
    seo.metaTitle ||
    destination.title ||
    'Travel Destination | Galaxy Travellers';

  const description =
    seo.metaDescription ||
    destination.description ||
    `Explore ${destination.title} with curated tours and experiences.`;

  const shareImage =
    seo.shareImage || destination.heroImg || '/default-share.jpg'; // fallback image you provide

  const url = `/destination/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImage],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const destination = await getDestination(slug);

  // Not found handling
  if (!destination) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <h1 className='text-4xl'>Destination Not Found</h1>
      </div>
    );
  }

  return <DestinationDetailsClient destination={destination.data} />;
}
