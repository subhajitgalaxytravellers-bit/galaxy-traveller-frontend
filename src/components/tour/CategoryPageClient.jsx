'use client';

import { useState, useEffect, useCallback } from 'react';
import { TourCard } from '@/components/tour/TourCard';
import { AiLoader } from '@/components/ui/ai-loader';
import { Button } from '@/components/ui/button';
import SafeImage from '@/components/common/SafeImage';
import Link from 'next/link';

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');

async function fetchCategoryTours(categoryTag, regionTag, { page = 1, limit = 12 } = {}) {
  const target = regionTag || categoryTag;
  const qs = new URLSearchParams({ page, limit });
  const res = await fetch(`${API_BASE}/api/categories/${target}/tours?${qs}`);
  if (!res.ok) return { items: [], total: 0, totalPages: 1, page: 1 };
  const json = await res.json();
  return json?.data || { items: [], total: 0, totalPages: 1, page: 1 };
}

export default function CategoryPageClient({ category, regions, initialTours, regionTag }) {
  const [activeRegion, setActiveRegion] = useState(regionTag || null);
  const [tours, setTours]               = useState(initialTours?.items || []);
  const [total, setTotal]               = useState(initialTours?.total || 0);
  const [totalPages, setTotalPages]     = useState(initialTours?.totalPages || 1);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);

  const load = useCallback(
    async (regionOverride = undefined, pageOverride = 1, append = false) => {
      const region = regionOverride === undefined ? activeRegion : regionOverride;
      const target = region || category?.tag;
      if (!target) return;

      append ? setLoadingMore(true) : setLoading(true);
      try {
        const data = await fetchCategoryTours(null, target, { page: pageOverride, limit: 12 });
        setTours((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(pageOverride);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeRegion, category?.tag],
  );

  const handleRegionClick = (regionTag) => {
    if (activeRegion === regionTag) return;
    setActiveRegion(regionTag);
    load(regionTag, 1, false);
  };

  const handleLoadMore = () => load(null, page + 1, true);

  const heroImg = category?.coverImg || (tours[0]?.heroImg ?? null);

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden">
        {heroImg && (
          <SafeImage src={heroImg} alt={category?.name || ''} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <p className="text-primary-foreground/70 text-sm uppercase tracking-widest mb-2 font-semibold">
            Tour Packages
          </p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold italic tracking-wide drop-shadow-xl">
            {category?.name || category?.tag}
          </h1>
          {category?.description && (
            <p className="mt-3 text-white/80 max-w-xl text-sm md:text-base">
              {category.description}
            </p>
          )}
          <p className="mt-2 text-white/60 text-sm">{total} packages available</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Region tabs */}
        {regions && regions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => {
                if (!activeRegion) return;
                setActiveRegion(null);
                load(null, 1, false);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                !activeRegion
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              All
            </button>
            {regions.map((r) => (
              <button
                key={r.tag}
                onClick={() => handleRegionClick(r.tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  activeRegion === r.tag
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {r.name || r.tag}
              </button>
            ))}
          </div>
        )}

        {/* Tours grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <AiLoader />
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No tours found in this category yet.</p>
            <Link href="/tours" className="text-primary hover:underline mt-2 block text-sm">
              Browse all tours →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tours.map((tour, idx) => (
                <TourCard key={tour.slug || tour._id || idx} tour={tour} />
              ))}
            </div>

            {page < totalPages && (
              <div className="flex justify-center mt-10">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="min-w-40"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
