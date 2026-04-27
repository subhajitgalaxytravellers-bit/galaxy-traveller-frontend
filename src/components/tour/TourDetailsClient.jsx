'use client';

import CTA from '@/components/common/CTA';
import BookingCard from '@/components/tour/BookingCard';
import EnquiryCard from '@/components/tour/EnquiryCard';
import ImageGallery from '@/components/tour/ImageGallery';
import MakeReview from '@/components/tour/MakeReview';
import OverviewCard from '@/components/tour/OverviewCard';
import TourFAQ from '@/components/tour/TourFAQ';
import TourHero from '@/components/tour/TourHero';
import TourHighlights from '@/components/tour/TourHighLight';
import TourInclusions from '@/components/tour/TourInclusions';
import TourItinerary from '@/components/tour/TourItinerary';
import TourMap from '@/components/tour/TourMap';
import TourMoments from '@/components/tour/TourMoment';
import TourOverview from '@/components/tour/TourOverview';
import TourReviews from '@/components/tour/TourReview';
import TourStays from '@/components/tour/TourStay';
import { useState, useEffect } from 'react';

export default function TourPageClient({ tour }) {
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'inclusions', label: 'Inclusions & Exclusions' },
    { id: 'map', label: 'Map' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: 'Reviews' },
  ];

  const [active, setActive] = useState('overview');
  const handleNavClick = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 110;
      const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActive(id);
    }
  };

  // Scroll Spy
  useEffect(() => {
    const spy = () => {
      let current = 'overview';
      sections.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 200) current = id;
      });
      setActive(current);
    };
    window.addEventListener('scroll', spy);
    return () => window.removeEventListener('scroll', spy);
  }, []);

  console.log(tour);
  return (
    <>
      <div className='min-h-screen bg-linear-to-b from-gray-100 to-white'>
        <TourHero
          id={tour.id}
          price={tour.price}
          title={tour.title}
          duration={tour?.overview?.duration}
          subtitle={tour.subtitle}
          location={tour.location}
          rating={tour.rating}
          reviewCount={tour.reviewCount}
          bookingCount={tour.bookingCount}
          badges={tour.badges}
          heroImage={tour.images.hero}
        />

        {/* Sticky Nav */}
        <div className='sticky top-20 bg-white/95 z-50 border-b pl-2 sm:px-5 lg:px-10 shadow-sm'>
          {/* Desktop */}
          <div className='hidden container mx-auto md:flex gap-6 px-9 py-3'>
            <a
              href={`#overview`}
              onClick={handleNavClick('overview')}
              className={`text-sm font-medium ${
                active === 'overview'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}>
              Overview
            </a>
            <a
              href={`#itinerary`}
              onClick={handleNavClick('itinerary')}
              className={`text-sm font-medium ${
                active === 'itinerary'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}>
              Itinerary
            </a>
            <a
              href={`#inclusions`}
              onClick={handleNavClick('inclusions')}
              className={`text-sm font-medium ${
                active === 'inclusions'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}>
              Inclusions
            </a>
            {tour.map && (
              <a
                href={`#map`}
                onClick={handleNavClick('map')}
                className={`text-sm font-medium ${
                  active === 'map'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}>
                Map
              </a>
            )}
            {
              <a
                href={`#gallery`}
                onClick={handleNavClick('gallery')}
                className={`text-sm font-medium ${
                  active === 'gallery'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}>
                Gallery
              </a>
            }
          </div>
          {/* Mobile */}
          <div className='flex md:hidden overflow-x-auto gap-4 px-4 py-2 scrollbar-hide'>
            <a
              href={`#overview`}
              onClick={handleNavClick('overview')}
              className={`text-sm font-medium ${
                active === 'overview'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}>
              Overview
            </a>
            <a
              href={`#itinerary`}
              onClick={handleNavClick('itinerary')}
              className={`text-sm font-medium ${
                active === 'itinerary'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}>
              Itinerary
            </a>
            <a
              href={`#inclusions`}
              onClick={handleNavClick('inclusions')}
              className={`text-sm font-medium ${
                active === 'inclusions'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}>
              Inclusions
            </a>
            {tour.map && (
              <a
                href={`#map`}
                onClick={handleNavClick('map')}
                className={`text-sm font-medium ${
                  active === 'map'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}>
                Map
              </a>
            )}
            {
              <a
                href={`#gallery`}
                onClick={handleNavClick('gallery')}
                className={`text-sm font-medium ${
                  active === 'gallery'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}>
                Gallery
              </a>
            }
          </div>
        </div>
        <div className='container wrap-anywhere mx-auto px-5 lg:px-10 py-8'>
          <div className='grid lg:grid-cols-3 gap-8'>
            {/* MAIN CONTENT */}
            {/* <div className=" md:hidden">
              <OverviewCard {...tour.overview} price={tour.price} />
            </div> */}
            <div className='lg:col-span-2 space-y-12'>
              {/* Sections */}
              <section id='overview' className='scroll-mt-28'>
                <TourOverview {...tour.overview} tagMonths={tour.tagMonths} />
              </section>

              {tour.highlights?.length > 0 && (
                <section id='highlights' className='scroll-mt-28'>
                  <TourHighlights highlights={tour.highlights} />
                </section>
              )}

              <section id='itinerary' className='scroll-mt-28'>
                <TourItinerary itinerary={tour.itinerary} />
              </section>

              <section id='inclusions' className='scroll-mt-28'>
                <TourInclusions
                  included={tour.included}
                  excluded={tour.excluded}
                />
              </section>

              {tour.stays?.length > 0 && (
                <section id='stays' className='scroll-mt-28'>
                  <TourStays stays={tour.stays} />
                </section>
              )}

              {tour.moments?.length > 0 && (
                <section id='moments' className='scroll-mt-28'>
                  <TourMoments moments={tour.moments} />
                </section>
              )}

              <section id='reviews' className='scroll-mt-28'>
                <TourReviews
                  reviews={tour.reviews}
                  overallRating={tour.rating}
                  totalReviews={tour.reviewCount}
                />
                <MakeReview tourIdOrSlug={tour.slug} />
              </section>

              {tour.faq?.length > 0 && (
                <section id='faq' className='scroll-mt-28'>
                  <TourFAQ faqs={tour.faq} />
                </section>
              )}

              {tour.mapEmbed && (
                <section id='map' className='scroll-mt-28'>
                  <TourMap mapEmbed={tour.mapEmbed} />
                </section>
              )}

              {tour.images?.gallery?.length > 0 && (
                <section id='gallery' className='scroll-mt-28'>
                  <h2 className='text-2xl font-semibold mb-4 mt-6'>
                    Photo Gallery
                  </h2>
                  <ImageGallery images={tour.images.gallery} />
                </section>
              )}
            </div>

            {/* SIDEBAR */}
            <div className='lg:col-span-1 space-y-6 lg:sticky lg:top-20'>
              <div className='max-md:hidden'>
                <OverviewCard
                  {...tour.overview}
                  price={tour.price}
                  maxGroupSize={tour.overview.groupSize}
                  suggestedAges={tour.overview.ageRange}
                />
              </div>
              <div id='booking' className='scroll-mt-28'>
                {tour.tourType === 'enquire' ? (
                  <EnquiryCard
                    tourId={tour.id}
                    creatorId={tour.creatorId}
                    tourName={tour.title}
                  />
                ) : (
                  <BookingCard
                    tourLocation={tour.location}
                    tourName={tour.title}
                    getDateRange={tour.dateRange}
                    basePrice={tour.price}
                    tourType={tour.tourType}
                    creatorId={tour.creatorId}
                    tourDuration={tour.overview.duration}
                    tourId={tour.id}
                    paymentConfig={tour.payment}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <CTA /> */}
    </>
  );
}
