"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import client from "@/api/client";
import CTA from "../common/CTA";
import { FlyerCard } from "./flyerCard";
import Image from "next/image";

export default function FlyersClient({ initialData, limit }) {
  const sentinelRef = useRef(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery({
      queryKey: ["flyers", limit],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await client.get("/flyer", {
          params: { page: pageParam, limit },
        });
        return res.data.data; // MUST match initialData shape
      },
      initialPageParam: 1,
      initialData: {
        pages: [initialData],
        pageParams: [1],
      },
      getNextPageParam: (last) => {
        const next = last.page + 1;
        if (last?.items?.length === 0) return undefined; // no more data
        if (last?.items?.length < limit) return undefined; // last page reached
        if (next > Math.ceil(last.total / limit)) return undefined;
        return next;
      },
    });

  const pages = data?.pages ?? [];
  const flyers = pages.flatMap((p) => p.items);

  // Intersection Observer (load more on scroll)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hero-bottom-fade z-10"></div>

        <Image
          src={"/assets/hero-blog.jpg"}
          alt="Flyers hero"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-20 text-center px-4 text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Promotional Flyers
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Explore our latest travel packages and special offers
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {flyers?.map((flyer, index) => {
            console.log(flyer);
            return <FlyerCard key={index} flyer={flyer} />;
          })}
        </div>

        {/* Infinite Scroll Sentinel */}
        <div className="mt-6 flex justify-center">
          {isFetchingNextPage ? (
            <div className="text-sm text-gray-500">Loading more...</div>
          ) : hasNextPage ? (
            <div ref={sentinelRef} className="h-10 w-full" />
          ) : (
            <div className="text-sm text-gray-400">No more flyers.</div>
          )}
        </div>
      </section>

      <CTA />
    </div>
  );
}



