import DestinationsClient from "@/components/destinations/DestinationsClient";
import { getAllDestinations } from "@/lib/destinations";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

export async function generateMetadata() {
  let title = "Destinations | Galaxy Travellers";
  let description =
    "Explore top destinations across continents. Find tours, pricing, and unforgettable travel experiences.";
  let shareImage = "/opengraph-destinations.jpg";

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
    // fallback
  }

  return {
    title,
    description,
    alternates: { canonical: "/destinations" },
    openGraph: {
      title,
      description,
      images: [{ url: shareImage, width: 1200, height: 630 }],
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
  const data = await getAllDestinations();
  const continents = data?.data?.group || [];

  return <DestinationsClient continents={continents} />;
}
