"use client";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date";
import {
  Calendar,
  Clock,
  Facebook,
  Globe,
  Instagram,
  User,
  Youtube,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { BlogCard } from "./BlogCard";
import { TourCard } from "../tour/TourCard";
import { DestinationCard } from "../destinations/DestinationCard";

export default function BlogDetailClient({ post }) {
  console.log(post);
  const formattedDate = formatDate(post.createdAt);

  const relatedPosts = Array.isArray(post?.blogs)
    ? post.blogs.filter((b) => b._id !== post._id).slice(0, 4)
    : [];
  const relatedTours = Array.isArray(post?.tours) ? post.tours : [];
  const relatedDestinations = Array.isArray(post?.destinations)
    ? post.destinations
    : [];

  console.log(post?.blogs);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 image-overlay">
          <Image
            src={post.displayImg}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 hero-bottom-fade z-10"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {post.title}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
            {post.bodyAlt}
          </p>
        </div>
      </section>

      {/* BODY */}
      {/* Article Content */}
      <article className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-12 pb-8 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-base">
                    {post?.author || post?.createdBy?.name || "John Doe"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{`${formattedDate.day} ${formattedDate.month} ${formattedDate.year}`}</span>
              </div>
              {post?.readTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime}</span>
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                {post.createdBy.social[2].url && (
                  <Button
                    onClick={() =>
                      window.open(post.createdBy.social[2].url, "_blank")
                    }
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                )}
                {post.createdBy.social[1].url && (
                  <Button
                    onClick={() =>
                      window.open(post.createdBy.social[1].url, "_blank")
                    }
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                )}
                {post.createdBy.social[0].url && (
                  <Button
                    onClick={() =>
                      window.open(post.createdBy.social[0].url, "_blank")
                    }
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <Youtube className="h-4 w-4" />
                  </Button>
                )}
                {post.createdBy.social[3].url && (
                  <Button
                    onClick={() =>
                      window.open(post.createdBy.social[3].url, "_blank")
                    }
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Article Body */}
            <div className="prose prose-lg max-w-none">
              {post.body.split("\n\n").map((paragraph, index) => {
                if (paragraph.startsWith("##")) {
                  return (
                    <h2
                      key={index}
                      className="font-heading text-3xl md:text-4xl font-bold mt-12 mb-6 text-foreground"
                    >
                      {paragraph.replace("## ", "")}
                    </h2>
                  );
                } else if (paragraph.startsWith("###")) {
                  return (
                    <h3
                      key={index}
                      className="font-heading text-2xl md:text-3xl font-semibold mt-10 mb-5 text-foreground"
                    >
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                } else if (paragraph.startsWith("- ")) {
                  const items = paragraph
                    .split("\n")
                    .filter((line) => line.startsWith("- "));
                  return (
                    <ul key={index} className="space-y-3 my-6">
                      {items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-muted-foreground leading-relaxed"
                        >
                          <span className="text-primary mt-1.5 flex-shrink-0">
                            •
                          </span>
                          <span>{item.replace("- ", "")}</span>
                        </li>
                      ))}
                    </ul>
                  );
                } else if (
                  paragraph.startsWith('"') &&
                  paragraph.endsWith('"')
                ) {
                  return (
                    <blockquote
                      key={index}
                      className="border-l-4 border-primary pl-6 py-4 my-8 italic text-lg text-foreground bg-secondary/30 rounded-r-lg"
                    >
                      {paragraph.replace(/^"|"$/g, "")}
                    </blockquote>
                  );
                } else if (paragraph.startsWith("![")) {
                  const match = paragraph.match(/!\[(.*?)\]\((.*?)\)/);
                  if (match) {
                    return (
                      <figure key={index} className="my-8 relative w-full h-96">
                        <Image
                          src={match[2]}
                          alt={match[1]}
                          fill
                          className="object-cover rounded-lg"
                        />
                        {/* {match[1] && (
                            <figcaption className="text-sm text-muted-foreground text-center mt-3">
                              {match[1]}
                            </figcaption>
                          )} */}
                      </figure>
                    );
                  }
                }
                return (
                  <p
                    key={index}
                    className="text-muted-foreground leading-relaxed text-lg mb-6"
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Tags & Share */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-12 pt-8 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                {post.categories.length > 0 &&
                  post.categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      className="text-sm"
                    >
                      {category.tag}
                    </Badge>
                  ))}
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                ← Back to all stories
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related Destinations */}
      {relatedDestinations.length > 0 && (
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-10 text-center">
              Destinations in this story
            </h2>

            <Carousel className="w-full">
              <CarouselContent>
                {relatedDestinations.slice(0, 4).map((dest, index) => (
                  <CarouselItem
                    key={dest._id || dest.slug || index}
                    className="basis-full md:basis-1/2 lg:basis-1/4">
                    <DestinationCard destination={dest} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>
      )}

      {/* Related Tours */}
      {relatedTours.length > 0 && (
        <section className="bg-background py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-10 text-center">
              Tours you might like
            </h2>

            <Carousel className="w-full">
              <CarouselContent>
                {relatedTours.slice(0, 4).map((tour, index) => (
                  <CarouselItem
                    key={tour._id || tour.slug || index}
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

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-secondary/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-10 text-center">
              Related Stories
            </h2>

            <Carousel className="w-full">
              <CarouselContent>
                {relatedPosts.map((relatedPost, index) => (
                  <CarouselItem
                    key={relatedPost._id || relatedPost.slug || index}
                    className="basis-full md:basis-1/2 lg:basis-1/4"
                  >
                    <BlogCard
                      id={relatedPost.slug}
                      title={relatedPost.title}
                      excerpt={relatedPost.bodyAlt}
                      image={relatedPost.displayImg}
                      category={relatedPost?.categories[0]?.tag}
                      date={relatedPost.createdAt}
                      readTime={relatedPost.readTime}
                      author={relatedPost.author}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation arrows */}
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>
      )}
    </div>
  );
}
