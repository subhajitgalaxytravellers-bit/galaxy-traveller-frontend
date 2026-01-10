import BookingsClient from './BookingsClient';

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');

export async function generateMetadata() {
  let title = 'My Bookings | Galaxy Travelers';
  let description = 'Review and manage your tour bookings, payments, and invoices.';
  let shareImage = '/opengraph-bookings.jpg';

  try {
    const res = await fetch(`${API_BASE}/api/site_global`, {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    const data = await res.json();
    const seo = data?.data?.defaultSeo || {};
    title = seo.metaTitle || title;
    description = seo.metaDescription || description;
    shareImage = seo.shareImage || shareImage;
  } catch (e) {
    // fallback to defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_URL || ''}/bookings`,
      images: [{ url: shareImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImage],
    },
  };
}

export default function Page() {
  return <BookingsClient />;
}
