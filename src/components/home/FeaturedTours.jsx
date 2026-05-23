'use client';

import { Button } from '@/components/ui/button';
import { TourCard, TourCardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock3, Users, Star, MapPin, ArrowUpRight, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SafeImage from '@/components/common/SafeImage';

const TOUR_TYPE_LABELS = {
  fixed_date: 'Fixed Dates',
  selectable_date: 'Flexible Dates',
  both: 'Fixed + Flexible',
};

const getTypeLabel = (type) =>
  TOUR_TYPE_LABELS[type] || type?.replaceAll('_', ' ') || 'Tour';

const hasPrice = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1, // Reduced from 0.15 for smoother performance
    },
  },
};

import { useMemo, useState } from 'react';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }, // Reduced from 0.6
  },
};

export default function FeaturedTours({ tours, groups = [], groupToursByTag = {} }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const displayTours = useMemo(
    () =>
      (activeTab === 'all'
        ? Array.isArray(tours)
          ? tours
          : []
        : Array.isArray(groupToursByTag?.[activeTab])
          ? groupToursByTag[activeTab]
          : []
      ).slice(0, 8),
    [activeTab, groupToursByTag, tours],
  );

  return (
    <section id='tours' className='py-24'>
      <div className='container mx-auto px-4'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className='text-center mb-16'>
          <p className='text-primary font-semibold mb-2 uppercase tracking-wider'>
            Featured Tours
          </p>
          <h2 className='font-heading text-4xl md:text-5xl font-bold mb-4 italic tracking-wide'>
            Popular Tour Packages
          </h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Carefully curated experiences designed to give you the adventure of
            a lifetime
          </p>
        </motion.div>

        {/* Category Tabs */}
        {groups.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              All Tours
            </button>
            {groups.map((g) => (
              <button
                key={g.tag}
                onClick={() => setActiveTab(g.tag)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === g.tag
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {g.name || g.tag}
              </button>
            ))}
          </div>
        )}

        {/* Tours Grid */}
        <motion.div
          key={activeTab} // Re-trigger animation on tab change
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {displayTours.length > 0 ? displayTours.map((tour, idx) => (
            <motion.div key={tour.id || idx} variants={cardVariants}>
              {(() => {
                const rawPrice = tour.price || tour.details?.pricePerPerson;
                const priceAvailable = hasPrice(rawPrice);
                return (
              <TourCard className='aspect-[3/4] rounded-2xl'>
                <SafeImage
                  src={tour.heroImg || '/assets/default-tour.jpg'}
                  seed={tour.slug || tour.title}
                  alt={tour.title}
                  fill
                  sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                  className='object-cover transition-transform duration-700 group-hover:scale-110 z-0'
                />
                
                <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none' />

                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/tour/${tour.slug}`);
                  }}
                  className='absolute right-4 top-4 z-20 flex items-center justify-between gap-2 rounded-xl bg-black/40 p-2.5 text-white backdrop-blur-md border border-white/10 cursor-pointer hover:bg-black/60 transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'>
                  <Edit3 className="mb-1 h-4 w-4" />
                  <span className='text-[9px] font-semibold uppercase tracking-wider'>Enquire</span>
                </div>

                <TourCardContent>
                  <h3 className='font-heading mb-1 line-clamp-2 text-[24px] font-bold leading-tight tracking-tight text-white drop-shadow-sm'>
                    {tour.title}
                  </h3>

                  <div className='mb-2.5 flex items-center gap-1.5 text-xs text-white/90 font-medium drop-shadow-sm'>
                    <MapPin className='h-3.5 w-3.5 shrink-0 text-white/70' />
                    <span className='truncate'>{tour.location || tour.place || 'Destination'}</span>
                  </div>

                  <div className='mb-6 flex items-center gap-3 text-xs font-medium text-white/80 drop-shadow-sm'>
                    <span className='flex items-center gap-1.5'>
                      <Clock3 className='h-3.5 w-3.5 text-white/60' />
                      {tour.duration || tour.details?.duration || 'Custom'}
                    </span>
                    <span className='text-white/30'>|</span>
                    <span className='flex items-center gap-1.5'>
                      <Users className='h-3.5 w-3.5 text-white/60' />
                      {tour.groupSize || tour.details?.groupSize || 'Any'} Persons
                    </span>
                  </div>

                  <div className='flex items-center justify-between mt-auto'>
                    <div className='flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-white backdrop-blur-md'>
                      <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                      <span className='text-xs font-medium'>
                        {tour.rating || 'New'}
                      </span>
                    </div>

                    <Button
                      onClick={() => router.push(`/tour/${tour.slug}`)}
                      className='rounded-full px-5 h-9 bg-[#3b6f6f] hover:bg-[#2c5252] text-white border-none shadow-md text-xs font-medium tracking-wide transition-colors'>
                      Explore
                      <ArrowUpRight className='ml-1.5 h-3.5 w-3.5' />
                    </Button>
                  </div>
                </TourCardContent>
              </TourCard>
                );
              })()}
            </motion.div>
          )) : (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No tours currently available in this category.
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className='text-center mt-12'>
          <Button
            onClick={() => router.push('/tours')}
            variant='outline'
            size='lg'
            className='px-8 hover:bg-primary hover:text-primary-foreground hover:border-primary'>
            View All Tours
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
