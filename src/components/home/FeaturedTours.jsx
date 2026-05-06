'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock3, Users, Star, MapPin, ArrowUpRight } from 'lucide-react';
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

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }, // Reduced from 0.6
  },
};

export default function FeaturedTours({ tours }) {
  const router = useRouter();

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
          <h2 className='text-4xl md:text-5xl font-bold mb-4'>
            Popular Tour Packages
          </h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Carefully curated experiences designed to give you the adventure of
            a lifetime
          </p>
        </motion.div>

        {/* Tours Grid */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, amount: 0.2 }}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {tours?.map((tour, idx) => (
            <motion.div key={tour.id || idx} variants={cardVariants}>
              {(() => {
                const rawPrice = tour.price || tour.details?.pricePerPerson;
                const priceAvailable = hasPrice(rawPrice);
                return (
              <Card className='group h-full p-0 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300'>
                <CardContent className='p-0'>
                  <div className='relative overflow-hidden aspect-[4/3]'>
                    <SafeImage
                      src={tour.heroImg || '/assets/default-tour.jpg'}
                      seed={tour.slug || tour.title}
                      alt={tour.title}
                      fill
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                      className='object-cover transition-transform duration-700 group-hover:scale-110'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

                    <Badge className='absolute right-4 top-4 border border-white/20 bg-black/50 text-white backdrop-blur-md'>
                      {tour.badge || getTypeLabel(tour.tourType)}
                    </Badge>

                    <div className='absolute left-4 bottom-4 flex items-center gap-1 rounded-full border border-white/30 bg-black/50 px-3 py-1 text-white backdrop-blur-md'>
                      <Star className='h-3.5 w-3.5 fill-yellow-300 text-yellow-300' />
                      <span className='text-xs font-medium'>
                        {tour.rating || 'New'} {tour.reviews ? `(${tour.reviews})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className='p-6'>
                    <div className='mb-3 flex items-center gap-2 text-sm text-muted-foreground'>
                      <MapPin className='h-4 w-4 text-primary' />
                      <span className='truncate'>{tour.location || tour.place || 'Destination'}</span>
                    </div>

                    <h3 className='mb-4 line-clamp-2 text-xl font-bold leading-tight transition-colors group-hover:text-primary'>
                      {tour.title}
                    </h3>

                    <div className='mb-6 flex items-center gap-3 text-sm'>
                      <div className='rounded-full bg-muted px-3 py-1.5 text-muted-foreground inline-flex items-center gap-2'>
                        <Clock3 className='h-4 w-4 text-primary' />
                        <span>{tour.duration || tour.details?.duration || 'Custom'}</span>
                      </div>
                      <div className='rounded-full bg-muted px-3 py-1.5 text-muted-foreground inline-flex items-center gap-2'>
                        <Users className='h-4 w-4 text-primary' />
                        <span>{tour.groupSize || tour.details?.groupSize || 'Any'} People</span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      {priceAvailable ? (
                        <div>
                          <p className='text-xs uppercase tracking-wide text-muted-foreground'>Starting from</p>
                          <p className='text-2xl font-bold text-primary'>
                            {`Rs. ${Number(rawPrice).toLocaleString()}`}
                          </p>
                        </div>
                      ) : (
                        <div />
                      )}

                      <Button
                        onClick={() => router.push(`/tour/${tour.slug}`)}
                        variant='default'
                        className='rounded-full px-5'>
                        Explore
                        <ArrowUpRight className='ml-2 h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
                );
              })()}
            </motion.div>
          ))}
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
