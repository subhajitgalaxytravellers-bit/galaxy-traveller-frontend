import BlogListClient from "@/components/blog/BlogListClient";
import { getAllBlogs } from "@/lib/blogs";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

export async function generateMetadata() {
  let title = "Galaxy Travelers Blog | Wanderlust - Stories & Guides";
  let description =
    "Explore inspiring travel stories, cultural insights, and destination guides.";
  let shareImage = "/opengraph-blogs.jpg";

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
      url: `${process.env.NEXT_PUBLIC_URL || ""}/blogs`,
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
  const blogs = await getAllBlogs();

  return <BlogListClient blogs={blogs} />;
}
