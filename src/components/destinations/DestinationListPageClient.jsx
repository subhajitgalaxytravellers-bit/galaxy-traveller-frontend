'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, IndianRupee, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { sanitizeGCSUrl } from '@/lib/sanitizeUrl';
import SafeImage from '@/components/common/SafeImage';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function hasStartingPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export default function DestinationListPageClient({ group }) {
  const { title, coverImg, destinations = [] } = group || {};

  // The hero image: prefer the group's coverImg, then first destination's heroImg
  const heroImg =
    coverImg ||
    (destinations.find((d) => d?.heroImg)?.heroImg ?? null);

  return (
    <div className='min-h-screen'>
      {/* ── HERO BANNER ── */}
      <div className='relative h-64 md:h-80 lg:h-96 w-full overflow-hidden'>
        {heroImg && (
          <SafeImage
            src={heroImg}
            alt={title || 'Destinations'}
            fill
            className='object-cover'
            priority
          />
        )}
        {/* Dark gradient overlay */}
        <div className='absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70' />

        {/* Hero text */}
        <div className='absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4'>
          <p className='text-primary-foreground/70 text-sm uppercase tracking-widest mb-2 font-semibold'>
            Destinations
          </p>
          <h1 className='font-heading text-4xl md:text-6xl font-bold italic tracking-wide drop-shadow-xl'>
            {title}
          </h1>
          <p className='mt-2 text-white/60 text-sm'>
            {destinations.length} destination{destinations.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className='container mx-auto px-4 py-10'>
        {/* Back link */}
        <Link
          href='/destinations'
          className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group'
        >
          <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
          All Destinations
        </Link>

        {/* Destinations grid */}
        <AnimatePresence mode='wait'>
          {destinations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='flex flex-col items-center justify-center py-20 text-center'
            >
              <p className='text-muted-foreground text-lg'>
                No destinations found in this collection yet.
              </p>
              <Link
                href='/destinations'
                className='text-primary hover:underline mt-2 block text-sm'
              >
                Browse all destinations →
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key={title}
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            >
              {destinations.map((destination, idx) => (
                <motion.div
                  key={destination._id || destination.id || idx}
                  variants={itemVariants}
                >
                  <Link href={`/destination/${destination.slug}`}>
                    <Card className='group p-0 overflow-hidden border-0 card-shadow hover:hover-shadow transition-all duration-300 cursor-pointer h-full'>
                      <CardContent className='p-0 relative h-80'>
                        <div className='relative overflow-hidden h-full'>
                          <Image
                            src={
                              sanitizeGCSUrl(destination?.heroImg) ||
                              '/hero/destinations.jpeg'
                            }
                            alt={destination.title || 'Destination'}
                            fill
                            className='object-cover group-hover:scale-110 transition-transform duration-500'
                            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
                            loading='lazy'
                          />
                          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />

                          {/* Default visible content */}
                          <div className='absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-300 group-hover:translate-y-[-20px]'>
                            <div className='flex items-center gap-2 mb-2'>
                              <MapPin className='w-4 h-4' />
                              <span className='text-sm font-medium'>
                                {destination.tourCount ??
                                  destination.tours?.length ??
                                  0}{' '}
                                Tours
                              </span>
                            </div>

                            <h3 className='font-heading text-2xl font-bold mb-2 tracking-tight'>
                              {destination.title}
                            </h3>

                            {hasStartingPrice(destination.startingPrice) && (
                              <div className='flex items-center gap-1'>
                                <span className='font-semibold'>
                                  Starting from{' '}
                                  {Number(destination.startingPrice).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Hover reveal */}
                          <div className='absolute inset-0 bg-blur backdrop-blur-lg translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-6 flex flex-col justify-center'>
                            <h3 className='font-heading text-2xl font-bold text-white mb-4 tracking-tight'>
                              {destination.title}
                            </h3>

                            <p className='text-white/90 mb-6 text-sm leading-relaxed line-clamp-4'>
                              {destination.description}
                            </p>

                            <div className='space-y-3'>
                              <div className='flex items-center gap-3 text-white'>
                                <MapPin className='w-5 h-5' />
                                <span className='text-sm font-medium'>
                                  {destination.tourCount ??
                                    destination.tours?.length ??
                                    0}{' '}
                                  Available Tours
                                </span>
                              </div>

                              {hasStartingPrice(destination.startingPrice) && (
                                <div className='flex items-center gap-3 text-white'>
                                  <IndianRupee className='w-5 h-5 text-white' />
                                  <span className='text-sm font-medium'>
                                    Starting from{' '}
                                    {Number(destination.startingPrice).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            <button className='mt-6 w-full bg-white text-primary font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors'>
                              Explore
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
