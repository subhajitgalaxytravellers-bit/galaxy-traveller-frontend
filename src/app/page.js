import Hero from "@/components/home/Hero";
import SearchBar from "@/components/home/SearchBar";
import PopularDestinations from "@/components/home/PopularDestinations";
import FeaturedTours from "@/components/home/FeaturedTours";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Testimonials from "@/components/home/Testimonials";
import BlogSection from "@/components/home/BlogSection";
import DetailSection from "@/components/home/DetailSection";
import { getTourGroups } from "@/lib/categories";

const API_BASE = (
  process.env.NEXT_PUBLIC_BASE_API ||
  process.env.BASE_API_URL ||
  "http://localhost:8080"
).replace(/\/$/, "");

export const revalidate = 300; // cache home payload for 5 minutes
export const preferredRegion = ["bom1"]; // keep Vercel compute close to GCP (Mumbai)

async function getSiteData() {
  try {
    const res = await fetch(`${API_BASE}/api/home`, {
      cache: "force-cache",
      next: { revalidate },
    });

    if (!res.ok) throw new Error("Failed to load site data");

    // backend responds with { success, data }
    return res.json();
  } catch (_error) {
    return { data: {}, reviews: [] };
  }
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
  const [{ data, reviews }, tourGroups] = await Promise.all([
    getSiteData(),
    getTourGroups(),
  ]);
  const hasHero = Array.isArray(data?.hero) && data.hero.length > 0;

  return (
    <div className="p-0 m-0">
      {hasHero && <Hero slides={data.hero} />}
      <SearchBar hasHero={hasHero} />

      <div className="mx-auto min-[1550px]:px-16">
        {data?.destinations?.length > 0 && (
          <PopularDestinations destinations={data.destinations} />
        )}

        <DetailSection
          primaryImage={data?.primaryImage}
          secondaryImage={data?.secondaryImage}
        />

        {data?.tours?.length > 0 && <FeaturedTours tours={data.tours} groups={tourGroups} />}

        <WhyChooseUs />

        {reviews?.length > 0 ||
          (data.reviews?.length > 0 && (
            <Testimonials reviews={reviews || data.reviews} />
          ))}

        {data?.blogs?.length > 0 && <BlogSection blogPosts={data.blogs} />}
      </div>

      {/* <CTA /> */}
    </div>
  );
}
