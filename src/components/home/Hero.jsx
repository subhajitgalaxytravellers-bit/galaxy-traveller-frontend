'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const Hero = ({ slides = [] }) => {
  const router = useRouter();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());

    emblaApi.on('select', onSelect);
    onSelect();

    return () => emblaApi?.off('select', onSelect);
  }, [emblaApi]);

  console.log(slides);

  return (
    <section className='relative h-screen overflow-hidden'>
      {/* Carousel */}
      <div className='overflow-hidden h-full' ref={emblaRef}>
        <div className='flex lg:h-full h-5/6'>
          {slides.map((slide, index) => (
            <div key={index} className='flex-[0_0_100%] min-w-0 relative'>
              {/* Background Image */}
              <div className='absolute inset-0 z-0'>
                <Image
                  src={slide.image || slide.heroImg}
                  alt={slide.title}
                  fill
                  className='object-cover'
                  priority={index === 0}
                />
                <div className='absolute inset-0 bg-linear-to-br from-black/40 via-black/20 to-black/70 z-1'></div>
              </div>

              {/* Content */}
              <div className='relative z-10 h-full flex items-center justify-center'>
                <div className='container mx-auto px-4 text-center text-white'>
                  <div className='max-w-4xl mx-auto animate-fade-in'>
                    <p className='text-base md:text-lg font-light mb-4 opacity-90 italic'>
                      Get unforgettable pleasure with us
                    </p>

                    <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold mb-5 leading-tight'>
                      {slide.title}
                      <br />
                      <span className='text-secondary'>{slide.subtitle}</span>
                    </h1>

                    <p className='text-base md:text-lg mb-10 opacity-90 max-w-2xl mx-auto'>
                      {slide.description}
                    </p>

                    <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                      <Button
                        onClick={() => router.push(slide.url || '/tours')}
                        size='lg'
                        variant='default'
                        className='text-lg px-8 py-6 group border-2 border-white/30 '>
                        {slide.cta || 'Explore Now'}
                        <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
                      </Button>

                      <Button
                        onClick={() => router.push('/contact')}
                        size='lg'
                        variant='secondary'
                        className='text-lg px-8 py-6 bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white border-2 border-white/30'>
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Left arrow */}
      {slides.length > 1 && (
        <button
          onClick={scrollPrev}
          className='hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 
          items-center justify-center transition-all text-white group'>
          <ChevronLeft className='w-6 h-6 group-hover:-translate-x-1 transition-transform' />
        </button>
      )}

      {/* Right arrow */}
      {slides.length > 1 && (
        <button
          onClick={scrollNext}
          className='hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 
          items-center justify-center transition-all text-white group'>
          <ChevronRight className='w-6 h-6 group-hover:translate-x-1 transition-transform' />
        </button>
      )}

      {/* Dots */}
      <div className='absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex gap-2'>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              selectedIndex === index
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className='absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce'>
        <div className='w-6 h-10 border-2 border-white/50 rounded-full flex justify-center'>
          <div className='w-1.5 h-2 bg-white/70 rounded-full mt-2 animate-pulse' />
        </div>
      </div>
    </section>
  );
};

export default Hero;
