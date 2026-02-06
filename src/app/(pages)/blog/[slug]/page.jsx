import BlogDetailClient from "@/components/blog/BlogDetailClient";
import { getBlog } from "@/lib/blogs";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlog(slug);

  if (!post) return { title: "Blog Not Found" };

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.bodyAlt,
    openGraph: {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.bodyAlt,

      images: [
        {
          url: post.seo?.shareImage,
          width: 1200,
          height: 630,
          alt: post.seo?.metaTitle || post.title,
        },
      ],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const post = await getBlog(slug);
  console.log(post);

  if (!post) {
    return <div className="py-32 text-center text-4xl">Blog Not Found</div>;
  }

  return <BlogDetailClient post={post} />;
}
