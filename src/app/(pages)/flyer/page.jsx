import FlyersClient from "@/components/flyer/FlyersClient";
import { getFlyers } from "@/lib/flyers";

export async function generateMetadata() {
  const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

  let title = "Flyers | Galaxy Travelers";
  let description = "Explore promotional travel flyers";
  let shareImage = "/opengraph-flyers.jpg";

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
    // fallback to defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_URL || ""}/flyer`,
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
  const limit = 12;
  const result = await getFlyers({ page: 1, limit });
  const initialData = result?.data ?? null;

  if (!initialData) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground text-lg">No flyers available right now.</p>
      </div>
    );
  }

  return <FlyersClient initialData={initialData} limit={limit} />;
}
