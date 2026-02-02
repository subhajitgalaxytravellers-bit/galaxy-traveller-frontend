import { Card } from '@/components/ui/card';
import {
  Award,
  Eye,
  Globe,
  MapPin,
  Target,
  Users,
  Heart,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import { Timeline } from '@/components/ui/timeline';
import { getTimelineData } from '@/lib/about';
import ImageCollage from '@/components/about/ImageCollage';
import TeamSection from '@/components/ui/team-section';
import StatsSection from '@/components/ui/stats-section';

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');

export async function generateMetadata() {
  let title = 'About Us | Galaxy Travelers';
  let description =
    'Learn about Galaxy Travelers - our mission, vision, values, journey, and the passionate team behind unforgettable travel experiences.';
  let shareImage = '/assets/hero-mountains.jpg';

  try {
    const res = await fetch(`${API_BASE}/api/site_global`, {
      cache: 'no-store',
    });
    const data = await res.json();
    const seo = data?.data?.defaultSeo || {};
    title = seo.metaTitle || title;
    description = seo.metaDescription || description;
    shareImage = seo.shareImage || shareImage;
  } catch (e) {
    // fallback to defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: shareImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImage],
    },
  };
}

export default async function AboutPage() {
  // Fetch stats and timeline in parallel
  const statsPromise = fetch(`${API_BASE}/api/site_global`, { cache: 'no-store' })
    .then(res => res.json())
    .catch(() => ({}));
  
  const timelinePromise = getTimelineData();

  const [statsData, timeline] = await Promise.all([statsPromise, timelinePromise]);

  const globalData = statsData?.data || statsData || {};
  const stats = {
    happyTravelers: globalData.happyTravelers || '50K+',
    countries: globalData.countries || '100+',
    tourPackages: globalData.tourPackages || '500+',
    yearsExperience: globalData.yearsExperience || '15'
  };

  const values = [
    {
      icon: Globe,
      title: 'Global Expertise',
      description:
        "With over 15 years of experience, we've helped thousands explore the world's most incredible destinations.",
    },
    {
      icon: Heart,
      title: 'Passionate Service',
      description:
        'Our team is dedicated to creating unforgettable travel experiences tailored to your dreams.',
    },
    {
      icon: Users,
      title: 'Community First',
      description:
        'We believe in responsible tourism that benefits local communities and preserves natural beauty.',
    },
    {
      icon: Award,
      title: 'Award Winning',
      description:
        'Recognized globally for excellence in travel services and customer satisfaction.',
    },
  ];



  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative h-[60vh] min-h-[360px] flex items-center justify-center overflow-hidden'>
        <div className='absolute inset-0 z-0'>
          <Image
            src={'/assets/hero-mountains.jpg'}
            alt='About GalaxyTravel - Mountain landscape'
            fill
            className='object-cover'
            priority
          />
          <div className="absolute inset-0 hero-bottom-fade z-10"></div>
        </div>
        
        <div className='relative z-10 text-center text-white px-4 animate-fade-in'>
          <h1 className='text-4xl md:text-6xl font-bold mb-4 md:mb-6'>
            About GalaxyTravel
          </h1>
          <p className='text-base sm:text-lg md:text-2xl max-w-3xl mx-auto mb-6 md:mb-8 opacity-95 px-2'>
            Crafting extraordinary journeys around the globe since 2009
          </p>
          <div className='flex gap-3 md:gap-4 justify-center flex-wrap px-2'>
            <div className='bg-background/10 backdrop-blur-sm border border-white/20 rounded-lg px-5 py-3 min-w-[120px]'>
              <div className='text-2xl md:text-3xl font-bold'>{stats.happyTravelers}</div>
              <div className='text-xs md:text-sm opacity-90'>
                Happy Travelers
              </div>
            </div>
            <div className='bg-background/10 backdrop-blur-sm border border-white/20 rounded-lg px-5 py-3 min-w-[120px]'>
              <div className='text-2xl md:text-3xl font-bold'>{stats.countries}</div>
              <div className='text-xs md:text-sm opacity-90'>Countries</div>
            </div>
            <div className='bg-background/10 backdrop-blur-sm border border-white/20 rounded-lg px-5 py-3 min-w-[120px]'>
              <div className='text-2xl md:text-3xl font-bold'>{stats.yearsExperience}</div>
              <div className='text-xs md:text-sm opacity-90'>Years</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className='py-14 md:py-20 px-4 sm:px-6 bg-muted/30'>
        <div className='container mx-auto'>
          <div className='grid md:grid-cols-2 gap-8'>
            <Card className='p-6 md:p-8 hover-shadow transition-all hover:scale-105'>
              <div className='bg-primary/10 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-5 md:mb-6'>
                <Target className='w-7 h-7 md:w-8 md:h-8 text-primary' />
              </div>
              <h2 className='text-2xl md:text-3xl font-bold mb-3 md:mb-4'>
                Our Mission
              </h2>
              <p className='text-muted-foreground text-base md:text-lg leading-relaxed'>
                To make world-class travel experiences accessible to everyone,
                creating meaningful connections between travelers and
                destinations while supporting local communities and preserving
                our planet&apos;s natural wonders for generations to come.
              </p>
            </Card>
            <Card className='p-6 md:p-8 hover-shadow transition-all hover:scale-105'>
              <div className='bg-primary/10 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-5 md:mb-6'>
                <Eye className='w-7 h-7 md:w-8 md:h-8 text-primary' />
              </div>
              <h2 className='text-2xl md:text-3xl font-bold mb-3 md:mb-4'>
                Our Vision
              </h2>
              <p className='text-muted-foreground text-base md:text-lg leading-relaxed'>
                To be the world&apos;s most trusted travel partner, known for
                transforming dreams into unforgettable journeys. We envision a
                future where travel enriches lives, bridges cultures, and
                creates lasting positive impact on both travelers and
                destinations.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className='py-14 md:py-20 px-4 sm:px-6'>
        <div className='container mx-auto'>
          <div className='grid md:grid-cols-2 gap-10 md:gap-12 items-center'>
            <div className='space-y-6'>
              <h2 className='text-3xl md:text-4xl font-bold'>Our Story</h2>
              <p className='text-muted-foreground text-base md:text-lg leading-relaxed'>
                GalaxyTravel was born from a simple idea: everyone deserves to
                experience the wonders of our world. What started as a small
                travel agency has grown into a global community of adventure
                seekers, culture enthusiasts, and nature lovers.
              </p>
              <p className='text-muted-foreground text-base md:text-lg leading-relaxed'>
                We believe that travel is more than just visiting new
                places-it&apos;s about connecting with different cultures,
                creating lasting memories, and discovering more about yourself
                along the way.
              </p>
              <p className='text-muted-foreground text-base md:text-lg leading-relaxed'>
                Today, we&apos;re proud to have helped over 50,000 travelers
                explore more than 100 countries, with each journey carefully
                crafted to exceed expectations.
              </p>
            </div>
            <div className="flex justify-center">
              <ImageCollage 
                img1="/assets/destination-alps.jpg"
                img2="/assets/hero-mountains.jpg"
                img3="/assets/hero-blog.jpg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className='py-20 px-4 bg-muted/30'>
        <div className='container mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold mb-4'>Our Values</h2>
            <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
              These principles guide everything we do, from planning your trip
              to supporting local communities
            </p>
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className='p-6 text-center hover-shadow transition-all hover:scale-105'>
                  <div className='bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Icon className='w-8 h-8 text-primary' />
                  </div>
                  <h3 className='text-xl font-semibold mb-3'>{value.title}</h3>
                  <p className='text-muted-foreground'>{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <div className='w-full'>
          <Timeline data={timeline} />
      </div>

      {/* Team Section */}
      <TeamSection />

      {/* Stats Section */}
      {/* <StatsSection stats={stats} /> */}
    </div>
  );
}
