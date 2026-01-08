"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/date";
import { useRouter } from "next/navigation";

const blogPost = [
  {
    id: 1,
    title: "10 Essential Tips for First-Time Travelers",
    excerpt:
      "Planning your first international trip? Here are the must-know tips to make your journey smooth and memorable.",
    image:
      "https://images.unsplash.com/photo-1500048993959-dc5b3c1b56d6?auto=format&fit=crop&w=1600&q=80",
    category: "Travel Tips",
    author: "Sarah Mitchell",
    date: "Nov 15, 2025",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Best Adventure Destinations for 2025",
    excerpt:
      "Discover the most thrilling locations for adrenaline junkies and adventure seekers around the globe.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    category: "Adventure",
    author: "Mike Johnson",
    date: "Nov 12, 2025",
    readTime: "7 min read",
  },
  {
    id: 3,
    title: "Experiencing Local Culture: A Guide",
    excerpt:
      "Learn how to immerse yourself in authentic local experiences and connect with communities worldwide.",
    image:
      "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1600&q=80",
    category: "Culture",
    author: "Emma Rodriguez",
    date: "Nov 8, 2025",
    readTime: "6 min read",
  },
];

const BlogSection = ({ blogPosts = blogPost }) => {
  const navigate = useRouter();

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 opacity-0 animate-fade-in-up">
          <p className="text-primary font-semibold mb-2 uppercase tracking-wider">
            Travel Insights
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Latest from Our Blog
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover travel tips, destination guides, and inspiring stories from
            around the world
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => {
            console.log(post.createdAt);
            const { day, month, year } = formatDate(post?.createdAt);
            return (
              <div
                key={index}
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Card className="group p-0 overflow-hidden border-0 card-shadow hover:hover-shadow transition-all duration-300 cursor-pointer">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative overflow-hidden aspect-[16/10]">
                      <Image
                        src={post.displayImg || post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {post.categories.length > 0 && (
                        <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                          {post.categories[0].tag}
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{post.date || `${day} ${month}, ${year}`}</span>
                        </div>
                        {post.readTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{post.readTime}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt || post.bodyAlt}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">
                            {post.author}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            navigate(`/blog/${post.slug}`);
                          }}
                          className="flex items-center gap-1 text-primary font-medium text-sm hover:gap-2 transition-all"
                        >
                          Read More
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* View All */}
        <div className="text-center mt-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Button
            onClick={() => {
              navigate("/blogs");
            }}
            variant="outline"
            size="lg"
            className="px-8"
          >
            View All Articles
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
