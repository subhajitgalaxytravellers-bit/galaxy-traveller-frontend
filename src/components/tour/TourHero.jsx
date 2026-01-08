import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import Image from 'next/image';

export default function TourHero({
  title,
  subtitle,
  location,
  rating = 4.5,
  reviewCount = 0,
  heroImage,
  duration,
  price,
  curatedBy = 'Galaxy Travellers Team',
}) {
  const finalImage =
    heroImage ||
    'https://t3.ftcdn.net/jpg/02/99/04/20/360_F_299042079_vGBD7wIlSeNl7vOevWHiL93G4koMM967.jpg';

  return (
    <div className='relative py-28 flex flex-col items-center h-fit min-h-[350px] w-full'>
      {/* Background Image */}

      <Image
        src={finalImage}
        alt={title}
        fill
        className='object-cover'
        priority
      />

      {/* Overlay */}
      <div className='absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-transparent' />

      <div className='relative container mx-auto h-full w-full  flex items-center px-4 sm:px-6 lg:px-10'>
        <div className='max-w-xl md:max-w-2xl text-white space-y-4 max-lg:w-full lg:max-w-[50vw] text-wrap wrap-break-word sm:space-y-6'>
          {/* Back */}
          <Link
            href='/tours'
            className='inline-flex items-center gap-1 sm:gap-2 text-white/80 hover:text-white transition-colors'>
            <ArrowLeft className='h-4 w-4 sm:h-5 sm:w-5' />
            <span className='text-sm sm:text-base'>Back to Tours</span>
          </Link>

          {/* Location */}
          {location && (
            <Badge
              variant='secondary'
              className='bg-white/10 ml-3 text-white border-white/20 text-xs sm:text-sm py-1 px-2'>
              <MapPin className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
              {location}
            </Badge>
          )}

          {/* Title */}
          <h1
            className='font-heading font-bold leading-tight
                         text-3xl sm:text-4xl md:text-5xl lg:text-6xl'>
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className='text-sm sm:text-base md:text-lg text-wrap wrap-break-word text-white/90 max-w-xl'>
              {subtitle}
            </p>
          )}

          {/* Ratings */}
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1'>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    i < Math.floor(rating)
                      ? 'fill-orange-500 text-orange-500'
                      : 'text-white/40'
                  }`}
                />
              ))}
            </div>
            <span className='text-xs sm:text-sm text-white/80'>
              {rating} ({reviewCount} reviews)
            </span>
          </div>

          {/* Duration + Price */}
          <div className='grid grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4'>
            <div>
              <p className='text-xs sm:text-sm text-white/60 uppercase mb-1'>
                Duration
              </p>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 sm:h-5 sm:w-5 text-gray-100' />
                <span className='text-lg sm:text-xl font-semibold'>
                  {duration || '—'}
                </span>
              </div>
            </div>

            <div>
              <p className='text-xs sm:text-sm text-white/60 uppercase mb-1'>
                Price Per Person
              </p>
              <div className='flex items-center gap-2 text-gray-100'>
                ₹
                <span className='text-lg sm:text-xl font-semibold text-white'>
                  {price || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className='md:hidden w-full mt-4'>
            <Button className={'w-full'} asChild>
              <Link href={`#booking`}>Book Now</Link>
            </Button>
          </div>

          {/* Curated By */}
          {/* <div className="flex items-center gap-3 pt-4 border-t border-white/20">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm sm:text-base">
              TT
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/60">Curated By</p>
              <p className="text-sm sm:text-base font-semibold">{curatedBy}</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
