'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TourCard } from '@/components/tour/TourCard';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import CTA from '@/components/common/CTA';
import { getSearchTours } from '@/lib/tours';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AiLoader } from '../ui/ai-loader';
import {
  formatTourPlaceShort,
  formatTourTitle,
  normalizeTourKey,
} from '@/lib/tourText';

// Debounce
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PRICE_MAX = 1000000;

function uniqueTours(list = []) {
  const seenSlugs = new Set();
  const seenKeys = new Set();

  return (list || []).filter((tour) => {
    const slug = String(tour?.slug || '').trim().toLowerCase();
    const title = formatTourTitle(tour?.title);
    const place = formatTourPlaceShort(tour?.place, title);
    const key = `${normalizeTourKey(title)}|${normalizeTourKey(place)}`;

    if (slug && seenSlugs.has(slug)) return false;
    if (seenKeys.has(key)) return false;

    if (slug) seenSlugs.add(slug);
    seenKeys.add(key);
    return true;
  });
}

export default function ToursClient({ initialPage, limit: initialLimit = 6 }) {
  const [items, setItems] = useState(uniqueTours(initialPage?.items || []));
  const [total, setTotal] = useState(initialPage?.total || 0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [priceRange, setPriceRange] = useState([0, PRICE_MAX]);
  const [durations, setDurations] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [tourTypes, setTourTypes] = useState([]);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 500);
  const searchParams = useSearchParams();

  const [hydrated, setHydrated] = useState(false);
  const observerRef = useRef(null);
  const loadingRef = useRef(false);

  const tourTypeOptions = ['fixed_date', 'selectable_date', 'both'];
  const tourTypeLabels = {
    fixed_date: 'Fixed Dates',
    selectable_date: 'Flexible Dates',
    both: 'Fixed + Flexible',
  };
  const durationOptions = ['1', '3', '5', '7', '14', '30'];
  const ratingOptions = [1, 2, 3, 4, 5];

  // -----------------------------
  // HYDRATE FROM URL QUERY PARAMS
  // -----------------------------
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || '';
    const urlTypes = searchParams.getAll('tourType');
    const cat = searchParams.get('category');
    const urlDur = searchParams.getAll('duration');
    const urlRatings = searchParams.getAll('minRating');
    const min = searchParams.get('min');
    const max = searchParams.get('max');

    setSearch(q);
    setTourTypes(urlTypes.length ? urlTypes : cat ? [cat] : []);
    setDurations(urlDur.length ? urlDur : []);
    setRatings(urlRatings.length ? urlRatings.map(Number) : []);
    setPriceRange([min ? Number(min) : 0, max ? Number(max) : PRICE_MAX]);
    setHydrated(true);
  }, [searchParams]);

  // ------------------------------------------------------------------
  // FETCH ON FILTER CHANGE — reset to page 1, REPLACE items
  // Note: no useCallback here to avoid circular dependency double-fetch
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const doFetch = async () => {
      setLoading(true);
      loadingRef.current = true;
      setPage(1);

      const data = await getSearchTours({
        page: 1,
        limit: initialLimit,
        q: debouncedSearch,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
        duration: durations,
        minRating: ratings,
        tourType: tourTypes,
      });

      if (cancelled) return;
      setItems(uniqueTours(data?.items || []));
      setTotal(data?.total || 0);
      setLoading(false);
      loadingRef.current = false;
    };

    doFetch();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, debouncedSearch, priceRange, durations, ratings, tourTypes]);

  // ---------------------------
  // LOAD MORE (APPEND next page)
  // ---------------------------
  const loadMore = useCallback(async () => {
    if (loadingRef.current || items.length >= total) return;
    const nextPage = page + 1;

    loadingRef.current = true;
    setLoading(true);

    const data = await getSearchTours({
      page: nextPage,
      limit: initialLimit,
      q: debouncedSearch,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
      duration: durations,
      minRating: ratings,
      tourType: tourTypes,
    });

    setItems((prev) => uniqueTours([...(prev || []), ...((data?.items || []))]));
    setTotal(data?.total || 0);
    setPage(nextPage);
    setLoading(false);
    loadingRef.current = false;
  }, [page, items.length, total, initialLimit, debouncedSearch, priceRange, durations, ratings, tourTypes]);

  // ---------------------------
  // INFINITE SCROLL WATCHER
  // ---------------------------
  useEffect(() => {
    if (!hydrated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && items.length < total && !loadingRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' },
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hydrated, items.length, total, loadMore]);

  // ---------------------------
  // RESET FILTERS
  // ---------------------------
  const resetFilters = () => {
    setPriceRange([0, PRICE_MAX]);
    setDurations([]);
    setRatings([]);
    setTourTypes([]);
    setSearch('');
  };

  // ---------------------------
  // RENDER
  // ---------------------------
  const renderFilters = () => (
    <div className='space-y-6'>
      {/* PRICE */}
      <div>
        <h4 className='text-sm font-medium mb-2'>Price Range (₹)</h4>

        <div className='flex items-center gap-3'>
          <Input
            type='number'
            min={0}
            max={PRICE_MAX}
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([Number(e.target.value), priceRange[1]])
            }
            placeholder='Min'
          />

          <span className='text-muted-foreground'>to</span>

          <Input
            type='number'
            min={0}
            max={PRICE_MAX}
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value)])
            }
            placeholder='Max'
          />
        </div>

        <div className='text-xs mt-1 text-muted-foreground'>
          Range: ₹{priceRange[0].toLocaleString()} – ₹
          {priceRange[1].toLocaleString()}
        </div>
      </div>

      {/* DURATION */}
      <div>
        <h4 className='text-sm font-medium mb-2'>Duration</h4>
        {durationOptions.map((d) => (
          <div key={d} className='flex items-center gap-2 my-1'>
            <Checkbox
              checked={durations.includes(d)}
              onCheckedChange={() =>
                setDurations((prev) =>
                  prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                )
              }
            />
            <span>{d}+ Days</span>
          </div>
        ))}
      </div>

      {/* RATINGS */}
      <div>
        <h4 className='text-sm font-medium mb-2'>Rating</h4>
        {ratingOptions.map((r) => (
          <div key={r} className='flex items-center gap-2 my-1'>
            <Checkbox
              checked={ratings.includes(r)}
              onCheckedChange={() =>
                setRatings((prev) =>
                  prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
                )
              }
            />
            <span>{r}+ Stars</span>
          </div>
        ))}
      </div>

      {/* TOUR TYPE */}
      <div>
        <h4 className='text-sm font-medium mb-2'>Travel Style</h4>
        {tourTypeOptions.map((t) => (
          <div key={t} className='flex items-center gap-2 my-1'>
            <Checkbox
              checked={tourTypes.includes(t)}
              onCheckedChange={() =>
                setTourTypes((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
                )
              }
            />
            <span>{tourTypeLabels[t] || t.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className='min-h-screen bg-background'>
        {/* HERO */}
        <section className='relative h-[70vh] min-h-[420px] md:h-[70vh] md:min-h-[420px] overflow-hidden'>
          <Image
            src='/hero/tours.jpeg'
            alt='Tours'
            fill
            className='object-cover'
            priority
          />
          <div className='absolute inset-0 hero-bottom-fade'></div>

          <div className='relative z-10 container mx-auto px-4 h-full flex flex-col justify-center text-center text-white'>
            <h1 className='text-4xl md:text-5xl font-bold'>
              Discover Your Next Adventure
            </h1>
            <p className='text-base md:text-lg mt-4'>
              Explore handpicked tours and experiences across incredible
              destinations
            </p>
          </div>
        </section>

        {/* MAIN */}
        <section className='py-12'>
          <div className='container mx-auto px-4 flex flex-col lg:flex-row gap-8'>
            {/* SIDEBAR */}
            <aside className='w-full lg:w-72 shrink-0 hidden lg:block'>
              <div className='sticky top-4 bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col' style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                {/* Header */}
                <div className='flex justify-between items-center px-5 py-4 border-b bg-muted/40 shrink-0'>
                  <h3 className='font-semibold text-base'>Filter Tours</h3>
                  <button
                    onClick={resetFilters}
                    className='text-xs text-primary hover:underline font-medium'>
                    Reset all
                  </button>
                </div>
                {/* Scrollable body */}
                <div className='overflow-y-auto flex-1 px-5 py-5 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
                  {renderFilters()}
                </div>
              </div>
            </aside>

            {/* RESULTS GRID */}
            <div className='flex-1'>
              {/* Search */}
              <div className='relative bg-white mb-6 flex items-center gap-3'>
                <div className='relative flex-1'>
                  <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder='Search tours...'
                    className='h-12 text-base pl-10'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className='lg:hidden'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant='outline'>Filters</Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align='end'
                      className='w-72 max-h-[70vh] overflow-y-auto p-0'>
                      <div className='flex justify-between items-center px-4 py-3 border-b bg-muted/40 sticky top-0'>
                        <h3 className='font-semibold text-sm'>Filter Tours</h3>
                        <button onClick={resetFilters} className='text-xs text-primary hover:underline font-medium'>
                          Reset all
                        </button>
                      </div>
                      <div className='p-4'>
                        {renderFilters()}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Cards */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                {items.map((tour) => (
                  <TourCard key={tour._id || tour.slug} tour={tour} />
                ))}

                {loading && (
                  <div className='col-span-full flex justify-center py-10'>
                    <AiLoader />
                  </div>
                )}

                {!loading && items.length === 0 && (
                  <div className='col-span-full text-center text-muted-foreground py-10'>
                    No tours match these filters.
                    <div className='mt-3 flex justify-center'>
                      <Button variant='secondary' onClick={resetFilters}>
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Infinite Scroll Trigger */}
              {items.length < total && (
                <div
                  ref={observerRef}
                  className='h-16 flex items-center justify-center text-muted-foreground'>
                  {loading ? 'Loading...' : 'Scroll to load more'}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* <CTA /> */}
    </>
  );
}
