import ContactClient from "./ContactClient";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

export async function generateMetadata() {
  let title = "Contact Us | Galaxy Travelers";
  let description =
    "Get in touch to plan your next adventure. Our team will help tailor your perfect journey.";
  let shareImage = "/opengraph-contact.jpg";

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

export default function Page() {
  return <ContactClient />;
}
