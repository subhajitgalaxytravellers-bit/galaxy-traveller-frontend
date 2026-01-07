'use client';

import { Card, CardContent } from '@/components/ui/card';
import { IndianRupeeIcon, MapPin } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const destinationVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

export default function PopularDestinations({ destinations }) {
  const x = useMotionValue(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!containerRef.current) return;

      const width =
        containerRef.current.scrollWidth - containerRef.current.offsetWidth;

      const current = x.get();

      // Loop back when reaching the end
      if (Math.abs(current) >= width) {
        x.set(0);
      } else {
        x.set(current - 300); // scrolling step
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id='destinations' className='py-24 bg-muted/30'>
      <div className='container mx-auto px-4'>
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className='text-center mb-16'>
          <p className='text-primary font-semibold mb-2 uppercase tracking-wider'>
            Explore The World
          </p>
          <h2 className='text-4xl md:text-5xl font-bold mb-4'>
            Popular Destinations
          </h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Discover our handpicked selection of the world&apos;s most
            breathtaking locations
          </p>
        </motion.div>

        {/* DESTINATIONS GRID */}
        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, amount: 0.2 }}
          className='grid grid-cols-1 md:grid-cols-2  lg:grid-cols-4 gap-6'>
          {destinations?.map((destination, idx) => (
            <Link
              href={`/destinations/${destination.slug}`}
              key={idx}
              className='min-w-[280px] md:min-w-[350px] lg:min-w-[380px]'>
              <motion.div className='p-2' variants={destinationVariants}>
                <Card className='group overflow-hidden p-0 border-0 card-shadow hover:hover-shadow transition-all duration-300 cursor-pointer'>
                  <CardContent className='p-0'>
                    <div className='relative overflow-hidden aspect-3/4'>
                      <Image
                        src={
                          destination.image ||
                          destination.heroImg ||
                          '/assets/default.jpg'
                        }
                        alt={destination.title}
                        fill
                        className='object-cover group-hover:scale-110 transition-transform duration-500'
                      />

                      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

                      <div className='absolute bottom-0 left-0 right-0 p-6 text-white'>
                        {destination.tours?.length > 0 && (
                          <div className='flex items-center gap-2 mb-2'>
                            <MapPin className='w-4 h-4' />
                            <span className='text-sm font-medium'>
                              {destination.tours.length} Tours
                            </span>
                          </div>
                        )}

                        <h3 className='text-2xl font-bold mb-2'>
                          {destination.title}
                        </h3>

                        <p className='text-sm text-white/80 mb-3'>
                          {destination.description}
                        </p>

                        <div className='flex items-center gap-1'>
                          <IndianRupeeIcon className='w-4 h-4' />
                          <span className='font-semibold mb-1'>
                            {destination.startingPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
