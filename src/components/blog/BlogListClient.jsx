'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Image from 'next/image';
import client from '@/api/client';
import { Input } from '@/components/ui/input';
import CTA from '@/components/common/CTA';
import { BlogCard } from './BlogCard';

// simple debounce hook
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function BlogListClient({ initialPage, limit = 9 }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);
  const sentinelRef = useRef(null);

  const fetchPage = async ({ pageParam = 1, queryKey }) => {
    const [, limitKey, searchKey] = queryKey;
    const res = await client.get('/blog', {
      params: { page: pageParam, limit: limitKey, q: searchKey || undefined },
    });
    return (
      res?.data?.data || {
        items: [],
        total: 0,
        page: pageParam,
        totalPages: 1,
        limit: limitKey,
      }
    );
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['blogs', limit, debounced],
    queryFn: fetchPage,
    initialPageParam: 1,
    getNextPageParam: (last) => {
      if (!last) return undefined;
      const next = last.page + 1;
      return next > (last.totalPages || 1) ? undefined : next;
    },
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [1] }
      : undefined,
    refetchOnWindowFocus: false,
  });

  const pages = data?.pages || [];
  const blogs = pages.flatMap((p) => p.items || []);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <>
      <div className='min-h-screen bg-background'>
        {/* HERO */}
        <section className='relative h-[70vh] min-h-[420px] md:h-[70vh] md:min-h-[420px] image-overlay'>
          <div className=''>
            <Image
              src='/assets/hero-blog.jpg'
              alt='Featured blog post'
              fill
              className='object-cover'
              priority
            />
            <div className='absolute inset-0 hero-bottom-fade z-10'></div>

            <div className='absolute inset-0 w-full justify-center z-20 px-16'>
              <div className=' mx-auto px-4 h-full justify-center text-center flex items-center  '>
                <div className='  text-white'>
                  <h1 className='font-heading text-3xl md:text-5xl font-bold mb-4'>
                    Discover World&apos;s Cultural Treasures
                  </h1>
                  <p className='text-base md:text-lg text-white/90 mb-6'>
                    Journey through vibrant festivals, ancient traditions, and
                    breathtaking landscapes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOG GRID */}
        <section className='py-16'>
          <div className='container mx-auto px-4 space-y-8'>
            <div className='w-full flex justify-end'>
              <div className='w-full md:w-1/2 lg:w-1/3 relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search articles by title, category, or summary...'
                  className='h-12 text-base pl-10'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {blogs.map((post, index) => (
                <div key={post._id || post.slug || index}>
                  <BlogCard
                    id={post.slug}
                    title={post.title}
                    excerpt={post.bodyAlt}
                    image={post.displayImg}
                    category={post.category}
                    date={post.updatedAt}
                    readTime={post.readTime}
                    author={post.author}
                  />
                </div>
              ))}

              {!isFetching && blogs.length === 0 && (
                <div className='col-span-full text-center text-muted-foreground'>
                  No articles found. Try a different search.
                </div>
              )}
            </div>

            {/* Infinite Scroll Trigger */}
            <div className='flex justify-center items-center h-12 text-sm text-muted-foreground'>
              {isFetchingNextPage
                ? 'Loading more...'
                : hasNextPage
                  ? <div ref={sentinelRef} className='h-full w-full' />
                  : blogs.length > 0
                    ? 'No more articles.'
                    : null}
            </div>
          </div>
        </section>
      </div>

      <CTA />
    </>
  );
}
