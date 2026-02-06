'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Calendar, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CTA from '@/components/common/CTA';
import Link from 'next/link';
import { sanitizeGCSUrl } from '@/lib/sanitizeUrl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

export default function DestinationsClient({ continents }) {
  const [selectedContinent, setSelectedContinent] = useState(
    continents?.[0]?.title || null,
  );
  const [searchQuery, setSearchQuery] = useState('');

  const activeContinent = continents.find((c) => c.title === selectedContinent);
  const allDestinations = activeContinent?.destinations || [];

  // Filter based on search query
  const filteredDestinations = allDestinations.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Reduced y for lighter animation
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }, // Reduced duration
  };

  const formatAvailability = (destination) => {
    const months = destination?.tagMonths || [];
    if (!Array.isArray(months) || months.length === 0) return 'Jan - Dec';
    const names = months
      .map((m) => m?.month || m?.monthTag || '')
      .filter(Boolean)
      .map((m) => m.charAt(0).toUpperCase() + m.slice(1));
    return names.length ? names.join(', ') : 'Jan - Dec';
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className='relative h-[70vh] min-h-[420px] md:h-[70vh] md:min-h-[420px] flex items-center justify-center overflow-hidden'>
        <div className='absolute inset-0 bg-linear-to-br from-primary/20 via-background to-accent/20' />
        <div className='relative z-20 text-center px-4'>
          <h1 className='text-3xl md:text-5xl font-bold text-white mb-4'>
            Feel the Adventure of a Lifetime
          </h1>
          <p className='text-base md:text-lg text-gray-300 max-w-2xl mx-auto'>
            Explore our destinations and embark on unforgettable journeys
          </p>
        </div>
        <div className='absolute inset-0 hero-bottom-fade z-10'></div>
        <Image
          src='/hero/destinations.jpeg'
          alt='Destinations Hero'
          fill
          className='object-cover'
          priority
        />
      </section>

      <div className='container mx-auto px-4 py-12'>
        <div className='flex flex-col lg:flex-row gap-12'>
          {/* Mobile/Tablet Dropdown */}
          <div className='lg:hidden space-y-4'>
            <div className='w-full'>
              <label className='sr-only' htmlFor='continent-select'>
                Select continent
              </label>
              <Select
                value={selectedContinent || ''}
                onValueChange={(val) => setSelectedContinent(val)}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select continent' />
                </SelectTrigger>
                <SelectContent>
                  {continents.map((continent) => (
                    <SelectItem key={continent.title} value={continent.title}>
                      {continent.title.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Mobile Search */}
            <div className='relative'>
              <input
                type='text'
                placeholder='Search destinations...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2 pl-10 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all'
              />
              <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'>
                  <circle cx='11' cy='11' r='8' />
                  <line x1='21' y1='21' x2='16.65' y2='16.65' />
                </svg>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className='lg:w-64 flex-shrink-0 hidden lg:block'>
            <div className='lg:sticky lg:top-24 space-y-6'>
              {/* Desktop Search */}
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full px-4 py-2 pl-10 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm'
                />
                <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <circle cx='11' cy='11' r='8' />
                    <line x1='21' y1='21' x2='16.65' y2='16.65' />
                  </svg>
                </div>
              </div>

              <nav className='space-y-2'>
                {continents.map((continent) => (
                  <button
                    key={continent.title}
                    onClick={() => {
                      setSelectedContinent(continent.title);
                      setSearchQuery(''); // Clear search on tab switch
                    }}
                    className={`w-full text-left px-4 py-3 text-lg font-medium transition-all duration-300 border-l-4 hover:bg-muted/50 ${
                      selectedContinent === continent.title
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}>
                    {continent.title.toUpperCase()}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* DESTINATIONS GRID */}
          <div className='flex-1 '>
            <AnimatePresence mode='wait'>
              {filteredDestinations.length > 0 ? (
                <motion.div
                  key={selectedContinent + searchQuery} // Key triggers re-animation only when needed
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                  exit='hidden'
                  className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {filteredDestinations.map((destination, index) => (
                    <motion.div
                      key={destination._id || index}
                      variants={itemVariants}>
                      <Link href={`/destination/${destination.slug}`}>
                        <Card className='group p-0 overflow-hidden border-0 card-shadow hover:hover-shadow transition-all duration-300 cursor-pointer h-full'>
                          <CardContent className='p-0 relative h-80'>
                            <div className='relative overflow-hidden h-full'>
                              <Image
                                src={destination.heroImg}
                                alt={destination.title}
                                fill
                                className='object-cover group-hover:scale-110 transition-transform duration-500'
                                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                                loading='lazy'
                              />
                              <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent' />

                              {/* Default Content */}
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

                                <h3 className='text-2xl font-bold mb-2'>
                                  {destination.title}
                                </h3>

                                <div className='flex items-center gap-1'>
                                  <span className='font-semibold'>
                                    Starting from Rs.{' '}
                                    {destination.startingPrice?.toLocaleString() ||
                                      '-'}
                                  </span>
                                </div>
                              </div>

                              {/* Hover Details */}
                              <div className='absolute inset-0 bg-blur backdrop-blur-lg translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-6 flex flex-col justify-center'>
                                <h3 className='text-2xl font-bold text-white mb-4'>
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

                                  <div className='flex items-center gap-3 text-white'>
                                    <IndianRupee className='w-5 h-5 text-white' />
                                    <span className='text-sm font-medium'>
                                      Starting from Rs.{' '}
                                      {destination.startingPrice?.toLocaleString() ||
                                        '-'}
                                    </span>
                                  </div>

                                  {/* <div className="flex items-start gap-3 text-white">
                                    <Calendar className="w-5 h-5 mt-0.5 shrink-0" />
                                    <span className="text-sm font-medium leading-tight">
                                        {formatAvailability(destination)}
                                    </span>
                                    </div> */}
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
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='flex flex-col items-center justify-center py-20 text-center'>
                  <p className='text-muted-foreground text-lg'>
                    No destinations found matching &quot;{searchQuery}&quot;
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className='mt-4 text-primary hover:underline font-medium'>
                    Clear Search
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* <CTA /> */}
    </>
  );
}
