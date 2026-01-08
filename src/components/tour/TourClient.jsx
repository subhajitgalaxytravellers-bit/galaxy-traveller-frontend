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

// Debounce
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ToursClient() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [limit, setLimit] = useState(6);

  // Filters
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [durations, setDurations] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [tourTypes, setTourTypes] = useState([]);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 500);
  const searchParams = useSearchParams();

  const [hydrated, setHydrated] = useState(false);
  const observerRef = useRef(null);

  const tourTypeOptions = ['fixed_date', 'selectable_date', 'both'];
  const durationOptions = ['1', '3', '5', '7', '14', '30'];
  const ratingOptions = [1, 2, 3, 4, 5];

  // -----------------------------
  // HYDRATE FROM URL QUERY PARAMS
  // -----------------------------
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || '';
    setSearch(q);

    // MULTI TOUR TYPES (tourType=?&tourType=?)
    const urlTypes = searchParams.getAll('tourType');
    setTourTypes(urlTypes.length ? urlTypes : []);

    // Allow fallback: category=
    const cat = searchParams.get('category');
    if (cat && !urlTypes.length) setTourTypes([cat]);

    // MULTI DURATION
    const urlDur = searchParams.getAll('duration');
    setDurations(urlDur.length ? urlDur : []);

    // MULTI RATING
    const urlRatings = searchParams.getAll('minRating');
    setRatings(urlRatings.length ? urlRatings.map(Number) : []);

    // PRICE
    const min = searchParams.get('min');
    const max = searchParams.get('max');

    setPriceRange([min ? Number(min) : 0, max ? Number(max) : 1000000]);

    setHydrated(true);
  }, []);

  // ---------------------------
  // FETCH TOURS (API)
  // ---------------------------
  const fetchTours = useCallback(
    async (fetchLimit) => {
      if (!hydrated) return;

      setLoading(true);

      const params = {
        page: 1,
        limit: fetchLimit,
        q: debouncedSearch,

        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,

        // multi-select arrays
        duration: durations,
        minRating: ratings,
        tourType: tourTypes,
      };

      const data = await getSearchTours(params);
      setItems(data.items || []);
      setTotal(data.total || 0);

      setLoading(false);
    },
    [hydrated, debouncedSearch, priceRange, durations, ratings, tourTypes],
  );

  // -----------------------------------------
  // FETCH WHEN FILTERS CHANGE (AFTER HYDRATE)
  // -----------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    setLimit(6);
    fetchTours(6);
  }, [hydrated, priceRange, durations, ratings, tourTypes, debouncedSearch]);

  // ---------------------------
  // LOAD MORE
  // ---------------------------
  useEffect(() => {
    if (!hydrated) return;
    if (limit === 6) return;
    fetchTours(limit);
  }, [limit]);

  // ---------------------------
  // INFINITE SCROLL WATCHER
  // ---------------------------
  useEffect(() => {
    if (!hydrated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && items.length < total) {
          setLimit((prev) => prev + 6);
        }
      },
      { threshold: 0.2 },
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hydrated, items, total]);

  // ---------------------------
  // RESET FILTERS
  // ---------------------------
  const resetFilters = () => {
    setPriceRange([0, 500000]);
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
      <div className='flex justify-between items-center'>
        <h3 className='font-semibold'>Filter By</h3>
        <Button variant='ghost' size='sm' onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {/* PRICE */}
      <div>
        <h4 className='text-sm font-medium mb-2'>Price Range (₹)</h4>

        <div className='flex items-center gap-3'>
          <Input
            type='number'
            min={0}
            max={500000}
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
            max={500000}
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
        <h4 className='text-sm font-medium mb-2'>Type</h4>
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
            <span className='capitalize'>{t.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className='min-h-screen bg-background'>
        {/* HERO */}
        <section className='relative h-[60vh] min-h-[400px] overflow-hidden'>
          <Image
            src='/assets/hero-blog.jpg'
            alt='Tours'
            fill
            className='object-cover'
            priority
          />
          <div className='absolute inset-0 hero-bottom-fade'></div>

          <div className='relative z-10 container mx-auto px-4 h-full flex flex-col justify-center text-center text-white'>
            <h1 className='text-5xl font-bold'>Discover Your Next Adventure</h1>
            <p className='text-lg mt-4'>
              Explore handpicked tours and experiences across incredible
              destinations
            </p>
          </div>
        </section>

        {/* MAIN */}
        <section className='py-12'>
          <div className='container mx-auto px-4 flex flex-col lg:flex-row gap-8'>
            {/* SIDEBAR */}
            <aside className='w-full lg:w-80 shrink-0 hidden lg:block'>
              <div className='sticky top-4 bg-card border rounded-lg p-6 space-y-6'>
                {renderFilters()}
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
                      className='w-[240px] max-h-[50vh] overflow-y-auto p-4'>
                      {renderFilters()}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Cards */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                {items.map((tour) => (
                  <TourCard key={tour._id} tour={tour} />
                ))}
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

      <CTA />
    </>
  );
}
