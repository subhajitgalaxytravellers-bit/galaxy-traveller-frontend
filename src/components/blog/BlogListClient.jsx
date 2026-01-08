'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import CTA from '@/components/common/CTA';
import Link from 'next/link';
import Image from 'next/image';
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

export default function BlogListClient({ blogs }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);

  const filtered = useMemo(() => {
    if (!debounced?.trim()) return blogs;
    const q = debounced.toLowerCase();
    return blogs.filter(
      (b) =>
        b?.title?.toLowerCase().includes(q) ||
        b?.bodyAlt?.toLowerCase().includes(q) ||
        b?.category?.toLowerCase().includes(q),
    );
  }, [debounced, blogs]);

  return (
    <>
      <div className='min-h-screen bg-background'>
        {/* HERO */}
        <section className='relative h-[60vh] min-h-[400px] image-overlay'>
          <div className=''>
            <Image
              src='/assets/hero-blog.jpg'
              alt='Featured blog post'
              fill
              className='object-cover'
              priority
            />
            {/* Gradient overlay */}
            {/* <div className="absolute inset-0 bg-gradient-to-br from-transparent  via-black/20 to-black/70 z-10"></div> */}
            {/* Gradient overlay */}
            <div className='absolute inset-0 hero-bottom-fade z-10'></div>

            <div className='absolute inset-0 w-full justify-center z-20 px-16'>
              <div className=' mx-auto px-4 h-full justify-center text-center flex items-center  '>
                <div className='  text-white'>
                  <h1 className='font-heading text-4xl md:text-6xl font-bold mb-4'>
                    Discover World&apos;s Cultural Treasures
                  </h1>
                  <p
                    className='text-lg md:text-xl text-white/90 mb-6'>
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
              {filtered.map((post, index) => (
                <div key={post.slug || index}>
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

              {!filtered.length && (
                <div className='col-span-full text-center text-muted-foreground'>
                  No articles found. Try a different search.
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
