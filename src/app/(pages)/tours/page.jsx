import ToursClient from "@/components/tour/TourClient";
import { getTours } from "@/lib/tours";

export async function generateMetadata() {
  const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

  let title = "Explore Tours | Galaxy Travelers";
  let description =
    "Discover premium travel tours, curated adventures, and breathtaking experiences across the world.";
  let shareImage = "/opengraph-tours.jpg";

  try {
    const res = await fetch(`${API_BASE}/api/site_global`, {
      cache: "force-cache",
      next: { revalidate: 900 },
    });
    const data = await res.json();
    const seo = data?.data?.defaultSeo || {};

    title = seo.metaTitle || title;
    description = seo.metaDescription || description;
    shareImage = seo.shareImage || shareImage;
  } catch (e) {
    // fallback to defaults on failure
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_URL || ""}/tours`,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: "Tours",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export default async function Page() {
  return <ToursClient />;
}
