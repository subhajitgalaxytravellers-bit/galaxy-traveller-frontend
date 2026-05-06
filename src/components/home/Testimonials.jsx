'use client';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AvatarImage } from '@radix-ui/react-avatar';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    location: 'New York, USA',
    rating: 5,
    text: "The Santorini tour was absolutely magical! Everything was perfectly organized, and our guide was incredibly knowledgeable. Can't wait to book another trip!",
    initials: 'SJ',
  },
  {
    id: 2,
    name: 'Michael Chen',
    location: 'Singapore',
    rating: 5,
    text: 'Best travel experience ever! The attention to detail and customer service was outstanding. The Bali cultural tour exceeded all our expectations.',
    initials: 'MC',
  },
  {
    id: 3,
    name: 'Emma Williams',
    location: 'London, UK',
    rating: 5,
    text: 'GalaxyTravel made our Alpine adventure unforgettable. From booking to the actual trip, everything was seamless. Highly recommend!',
    initials: 'EW',
  },
];

const Testimonials = ({ reviews }) => {
  const items = useMemo(() => reviews || testimonials, [reviews]);
  const [index, setIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w >= 1280) return 4;
      if (w >= 1024) return 3;
      if (w >= 768) return 2;
      return 1;
    };
    const handle = () => setSlidesPerView(compute());
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const handleNext = () => setIndex((i) => (i + 1) % items.length);
  const handlePrev = () =>
    setIndex((i) => (i - 1 + items.length) % items.length);

  const canSlide = items.length > slidesPerView;

  return (
    <section className='py-24 md:py-28'>
      <div className='container mx-auto '>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className='text-center mb-16'>
          <p className='text-primary font-semibold mb-2 uppercase tracking-wider'>
            Testimonials
          </p>
          <h2 className='font-heading text-4xl md:text-5xl font-bold mb-4 italic tracking-wide'>
            What Our Travelers Say
          </h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Don&apos;t just take our word for it - hear from our happy travelers
          </p>
        </motion.div>

        {/* Slider */}
        <div className='relative w-full'>
          <div className='overflow-hidden'>
            <div
              className='flex py-4 transition-transform duration-500'
              style={{
                transform: `translateX(-${(index / slidesPerView) * 100}%)`,
              }}>
              {items.map((testimonial, i) => (
                <div
                  key={i}
                  className='shrink-0 px-3'
                  style={{ width: `${100 / slidesPerView}%` }}>
                  <Card className='p-0 h-full border-0 card-shadow hover:hover-shadow transition-all duration-300 bg-background'>
                    <CardContent className='pt-8 pb-8 h-full flex flex-col'>
                      <Quote className='w-10 h-10 text-primary/20 mb-4' />

                      <div className='flex gap-1 mb-4'>
                        {[...Array(testimonial.stars)].map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            className='w-4 h-4 fill-yellow-400 text-yellow-400'
                          />
                        ))}
                      </div>

                      <p className='text-muted-foreground leading-relaxed grow wrap-break-word line-clamp-5'>
                        {testimonial.review}
                      </p>

                      <div className='flex items-center gap-4 mt-6'>
                        <Avatar className='w-12 h-12 bg-primary text-primary-foreground'>
                          <AvatarImage
                            className={' rounded-sm w-full h-full'}
                            src={testimonial.img}
                            alt={testimonial.name}
                          />
                          <AvatarFallback className='bg-primary text-primary-foreground'>
                            {testimonial.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-semibold'>{testimonial.name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {testimonial.place}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          {canSlide && (
            <div className='flex items-center justify-between mt-6 px-3'>
              <button
                onClick={handlePrev}
                className='p-2 rounded-full border border-border hover:bg-muted transition-colors'
                aria-label='Previous testimonial'>
                <ChevronLeft className='w-5 h-5' />
              </button>
              <div className='flex gap-2'>
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === index ? 'w-6 bg-primary' : 'w-2.5 bg-muted'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className='p-2 rounded-full border border-border hover:bg-muted transition-colors'
                aria-label='Next testimonial'>
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
