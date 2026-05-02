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
  const seoMetaTitle = typeof post?.seo?.metaTitle === "string" ? post.seo.metaTitle.trim() : "";
  const rawTitle = typeof post?.title === "string" ? post.title.trim() : "";
  const rawSlug = typeof post?.slug === "string" ? post.slug.trim() : "";
  const cleanSeoTitle = seoMetaTitle
    ? seoMetaTitle.replace(/\s*\|\s*Galaxy Travellers\s*$/i, "").trim()
    : "";
  const heroTitle = rawSlug || rawTitle || cleanSeoTitle || "Blog";
  const displayTitle = rawTitle || cleanSeoTitle || rawSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Blog";
  const displaySummary =
    typeof post?.bodyAlt === "string" && post.bodyAlt.trim()
      ? post.bodyAlt.trim().slice(0, 220)
      : "";
  const heroImage =
    post?.displayImg || post?.seo?.shareImage || "/assets/default.jpg";
  const social = Array.isArray(post?.createdBy?.social)
    ? post.createdBy.social
    : [];
  const youtubeUrl = social?.[0]?.url || "";
  const instagramUrl = social?.[1]?.url || "";
  const facebookUrl = social?.[2]?.url || "";
  const websiteUrl = social?.[3]?.url || "";
  const bodyText =
    typeof post?.body === "string" && post.body.trim()
      ? post.body
      : post?.bodyAlt || "";
  const paragraphs = bodyText ? bodyText.split("\n\n") : [];
  const categories = Array.isArray(post?.categories) ? post.categories : [];

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
      <section className="relative h-[50vh] min-h-[360px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 image-overlay">
          <Image
            src={heroImage}
            alt={displayTitle}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/35 z-10"></div>
          <div className="absolute inset-0 hero-bottom-fade z-20"></div>
        </div>
        <div className="relative z-30 container mx-auto px-4 text-center text-white">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4 break-words [text-wrap:balance] drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
            {heroTitle}
          </h2>
          {displaySummary && (
            <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]">
              {displaySummary}
            </p>
          )}
        </div>
      </section>

      {/* BODY */}
      {/* Article Content */}
      <article className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight tracking-tight [text-wrap:balance]">
              {displayTitle}
            </h1>
            {displaySummary && (
              <p className="text-foreground/80 text-lg md:text-xl leading-relaxed mb-10 border-l-4 border-primary/50 pl-5 italic">
                {displaySummary}
              </p>
            )}
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-y-4 gap-x-6 text-sm text-muted-foreground mb-12 pb-8 border-b border-border/60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-primary/70 mb-0.5">Written by</span>
                  <span className="font-bold text-foreground text-base md:text-lg">
                    {post?.author || post?.createdBy?.name || "Galaxy Editorial"}
                  </span>
                </div>
              </div>
              
              <div className="hidden md:block h-10 w-px bg-border/60 mx-2"></div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5 bg-secondary/40 px-3.5 py-1.5 rounded-full border border-border/50">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground/80">{`${formattedDate.day} ${formattedDate.month} ${formattedDate.year}`}</span>
                </div>
                {post?.readTime && (
                  <div className="flex items-center gap-2.5 bg-secondary/40 px-3.5 py-1.5 rounded-full border border-border/50">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground/80">{post.readTime}</span>
                  </div>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {facebookUrl && (
                  <Button
                    onClick={() => window.open(facebookUrl, "_blank")}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                )}
                {instagramUrl && (
                  <Button
                    onClick={() => window.open(instagramUrl, "_blank")}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                )}
                {youtubeUrl && (
                  <Button
                    onClick={() => window.open(youtubeUrl, "_blank")}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <Youtube className="h-4 w-4" />
                  </Button>
                )}
                {websiteUrl && (
                  <Button
                    onClick={() => window.open(websiteUrl, "_blank")}
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
            <div className="prose prose-xl max-w-none prose-headings:font-heading prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-2xl">
              {paragraphs.map((paragraph, index) => {
                if (paragraph.startsWith("##")) {
                  return (
                    <h2
                      key={index}
                      className="font-heading text-3xl md:text-4xl font-extrabold mt-14 mb-8 text-foreground tracking-tight"
                    >
                      {paragraph.replace("## ", "")}
                    </h2>
                  );
                } else if (paragraph.startsWith("###")) {
                  return (
                    <h3
                      key={index}
                      className="font-heading text-2xl md:text-3xl font-bold mt-12 mb-6 text-foreground tracking-tight"
                    >
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                } else if (paragraph.startsWith("- ")) {
                  const items = paragraph
                    .split("\n")
                    .filter((line) => line.startsWith("- "));
                  return (
                    <ul key={index} className="space-y-4 my-8 pl-4 border-l-2 border-primary/20">
                      {items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-4 text-foreground/80 leading-relaxed text-lg"
                        >
                          <span className="text-primary mt-2 flex-shrink-0 bg-primary/10 rounded-full h-2 w-2" />
                          <span className="flex-1">{item.replace("- ", "")}</span>
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
                      className="relative border-l-4 border-primary pl-8 py-6 my-12 italic text-xl md:text-2xl text-foreground bg-primary/5 rounded-r-2xl font-serif leading-relaxed"
                    >
                      <span className="absolute -top-4 -left-6 text-6xl text-primary/20 font-serif font-black">&quot;</span>
                      {paragraph.replace(/^"|"$/g, "")}
                    </blockquote>
                  );
                } else if (paragraph.startsWith("![")) {
                  const match = paragraph.match(/!\[(.*?)\]\((.*?)\)/);
                  if (match) {
                    return (
                      <figure key={index} className="my-12 relative w-full h-[30rem] md:h-[35rem] shadow-xl group overflow-hidden rounded-2xl">
                        <Image
                          src={match[2]}
                          alt={match[1]}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
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
                    className="text-foreground/80 leading-[1.8] text-[17px] md:text-[19px] mb-8 font-light"
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Tags & Share */}
            <div className="flex flex-wrap items-center justify-between gap-6 mt-16 pt-10 border-t border-border/60">
              <div className="flex items-center gap-3 flex-wrap">
                {categories.length > 0 &&
                  categories.map((category, index) => {
                    const categoryLabel =
                      typeof category === "string"
                        ? category
                        : category?.tag ||
                          category?.name ||
                          category?.title ||
                          "Category";
                    const categoryKey =
                      (typeof category === "string" && category) ||
                      category?.id ||
                      category?._id ||
                      category?.slug ||
                      `category-${index}`;

                    return (
                    <Badge
                      key={categoryKey}
                      variant="secondary"
                      className="px-4 py-1.5 text-sm md:text-base font-medium rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors cursor-pointer border border-transparent hover:border-primary/20"
                    >
                      {categoryLabel}
                    </Badge>
                    );
                  })}
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
