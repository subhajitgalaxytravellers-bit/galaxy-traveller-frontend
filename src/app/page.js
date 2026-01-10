import Hero from "@/components/home/Hero";
import SearchBar from "@/components/home/SearchBar";
import PopularDestinations from "@/components/home/PopularDestinations";
import FeaturedTours from "@/components/home/FeaturedTours";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Testimonials from "@/components/home/Testimonials";
import BlogSection from "@/components/home/BlogSection";
import DetailSection from "@/components/home/DetailSection";
import CTA from "@/components/common/CTA";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || "").replace(/\/$/, "");

export const revalidate = 300; // cache home payload for 5 minutes
export const preferredRegion = ["bom1"]; // keep Vercel compute close to GCP (Mumbai)

async function getSiteData() {
  const res = await fetch(`${API_BASE}/api/home`, {
    cache: "force-cache",
    next: { revalidate },
  });

  if (!res.ok) throw new Error("Failed to load site data");

  // backend responds with { success, data }
  return res.json();
}

export async function generateMetadata() {
  let title = "Galaxy Travel - Explore the World";
  let description = "Find curated tours, destinations, and travel experiences.";
  let shareImage = "/opengraph-home.jpg";

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

export default async function HomePage() {
  const { data, reviews } = await getSiteData();

  console.log(data, reviews);

  return (
    <div className="p-0 m-0">
      {data?.hero?.length > 0 && <Hero slides={data.hero} />}
      <SearchBar />

      <div className="mx-auto min-[1550px]:px-16">
        {data?.destinations?.length > 0 && (
          <PopularDestinations destinations={data.destinations} />
        )}

        <DetailSection />

        {data?.tours?.length > 0 && <FeaturedTours tours={data.tours} />}

        <WhyChooseUs />

        {reviews?.length > 0 ||
          (data.reviews?.length > 0 && (
            <Testimonials reviews={reviews || data.reviews} />
          ))}

        {data?.blogs?.length > 0 && <BlogSection blogPosts={data.blogs} />}
      </div>

      <CTA />
    </div>
  );
}
