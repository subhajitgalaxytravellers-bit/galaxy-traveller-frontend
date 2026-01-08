"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowDown,
  MapPin,
  Star,
  Calendar,
  Users,
  ChevronLeft,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sanitizeGCSUrl } from "@/lib/sanitizeUrl";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TourCard } from "@/components/tour/TourCard";
import { BlogCard } from "@/components/blog/BlogCard";
import Image from "next/image";

export default function DestinationDetailsClient({ destination }) {
  const router = useRouter();
  const relatedTours = Array.isArray(destination?.tours)
    ? destination.tours
    : [];
  const relatedBlogs = Array.isArray(destination?.blogs)
    ? destination.blogs
    : [];

  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <Image
            src={sanitizeGCSUrl(destination.heroImg)}
            alt={destination.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 hero-bottom-fade" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              {destination.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              {destination.tagline}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-12"
          >
            <div className="flex flex-col items-center gap-2 text-white">
              <span className="text-sm font-medium">Scroll</span>
              <ArrowDown className="w-6 h-6 animate-bounce" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* BACK BUTTON */}
            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Destinations</span>
            </Link>

            {/* DESCRIPTION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6">{destination.title}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {destination.description}
              </p>

              <Button
                onClick={() => router.push("/contact")}
                size="lg"
                className="mb-12"
              >
                Start Planning Your Trip
              </Button>
            </motion.div>

            {/* STATS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
            >
              {destination?.tours?.length > 0 && (
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">
                      {destination.tours.length} Tours
                    </h3>
                  </CardContent>
                </Card>
              )}

              {destination?.rating && (
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">
                      {destination.rating} Rating
                    </h3>
                  </CardContent>
                </Card>
              )}

              {destination?.startingPrice && (
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <IndianRupee className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">
                      {destination.startingPrice} Rupees
                    </h3>
                  </CardContent>
                </Card>
              )}

              {destination?.tagMonths?.length > 0 && (
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">
                      {destination.tagMonths[0]}
                    </h3>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* HIGHLIGHTS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h3 className="text-3xl font-bold mb-8">Experience Highlights</h3>
              <p className="text-lg text-foreground leading-relaxed">
                {destination.highlight?.brief}
              </p>
            </motion.div>

            {/* HIGHLIGHT IMAGE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <Image
                src={sanitizeGCSUrl(destination.highlight?.img)}
                alt={`${destination.title} highlight`}
                width={1200}
                height={500}
                className="w-full h-[500px] object-cover rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Tours */}
      {relatedTours.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Tours in {destination.title}
                </h2>
                <p className="text-muted-foreground mt-2">
                  Handpicked journeys to explore this destination.
                </p>
              </div>
            </div>

            <Carousel className="w-full">
              <CarouselContent>
                {relatedTours.slice(0, 4).map((tour, idx) => (
                  <CarouselItem
                    key={tour._id || tour.slug || idx}
                    className="basis-full md:basis-1/2 lg:basis-1/4">
                    <TourCard tour={tour} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>
      )}

      {/* Related Blogs */}
      {relatedBlogs.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Stories from {destination.title}
                </h2>
                <p className="text-muted-foreground mt-2">
                  Tips and inspiration from fellow travelers.
                </p>
              </div>
            </div>

            <Carousel className="w-full">
              <CarouselContent>
                {relatedBlogs.slice(0, 4).map((blog, idx) => (
                  <CarouselItem
                    key={blog._id || blog.slug || idx}
                    className="basis-full md:basis-1/2 lg:basis-1/4">
                    <BlogCard
                      id={blog.slug}
                      title={blog.title}
                      excerpt={blog.bodyAlt}
                      image={sanitizeGCSUrl(blog.displayImg || blog.heroImg)}
                      category={blog?.categories?.[0]?.tag}
                      date={blog.createdAt}
                      readTime={blog.readTime}
                      author={blog.author}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            Ready to Explore? Let&apos;s Plan Your Trip!
          </h2>
          <Button
            size="lg"
            onClick={() => router.push("/contact")}
            variant="outline"
            className="text-lg text-primary hover:bg-gray-300 hover:text-primary px-8 py-6"
          >
            Get a Quote
          </Button>
        </div>
      </section>
    </div>
  );
}
