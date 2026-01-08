'use client';
import { Card } from '@/components/ui/card';
import {
  Award,
  Clock,
  Eye,
  Globe,
  MapPin,
  Target,
  Users,
  Heart,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');

 async function generateMetadata() {
  let title = 'About Us | Galaxy Travelers';
  let description =
    'Learn about Galaxy Travelers - our mission, vision, values, journey, and the passionate team behind unforgettable travel experiences.';
  let shareImage = '/images/about/hero.jpg';

  try {
    const res = await fetch(`${API_BASE}/api/site_global`, {
      cache: 'no-store',
    });
    const data = await res.json();

    console.log(data);
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

export default function AboutPage() {
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

  const timeline = [
    {
      year: '2009',
      title: 'The Beginning',
      description:
        'Started as a small agency with a passion for adventure and cultural exploration.',
    },
    {
      year: '2012',
      title: 'Global Expansion',
      description: 'Expanded operations to 50+ countries across 5 continents.',
    },
    {
      year: '2016',
      title: 'Digital Innovation',
      description:
        'Launched our online platform, making travel planning accessible to everyone.',
    },
    {
      year: '2020',
      title: 'Sustainable Tourism',
      description:
        'Committed to eco-friendly travel practices and long-term environmental responsibility.',
    },
    {
      year: '2024',
      title: '50,000+ Travelers',
      description: 'Celebrated a major milestone in unforgettable journeys.',
    },
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      image: '/images/about/team-1.jpg',
    },
    {
      name: 'Michael Chen',
      role: 'Head of Operations',
      image: '/images/about/team-2.jpg',
    },
    {
      name: 'Emma Williams',
      role: 'Experience Director',
      image: '/images/about/team-3.jpg',
    },
    {
      name: 'David Martinez',
      role: 'Customer Relations',
      image: '/images/about/team-4.jpg',
    },
  ];

  const [stats, setStats] = useState({
    happyTravelers: '50K+',
    countries: '100+',
    tourPackages: '500+',
    yearsExperience: '15'
  });

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/site_global`);
          console.log(res);

        if (res.ok) {
          const result = await res.json();
          // Adjust based on actual response structure (e.g., result.data or result)
          const data = result.data || result; 

          if (data) {
            setStats({
              happyTravelers: data.happyTravelers || '50K+',
              countries: data.countries || '100+',
              tourPackages: data.tourPackages || '500+',
              yearsExperience: data.yearsExperience || '15'
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch global stats:", error);
      }
    };
    fetchGlobalStats();
  }, []);

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
          {/* <div className='absolute inset-0 hero-bottom-fade z-10'></div> */}
        </div>
        {/* Gradient overlay */}

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
                To be the world&lsquo;s most trusted travel partner, known for
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
            <div className='relative h-[300px] sm:h-[380px] md:h-[500px] rounded-lg overflow-hidden card-shadow hover-shadow transition-all'>
              <Image
                src={'/assets/destination-alps.jpg'}
                alt='Our team at work'
                fill
                className='object-cover'
                sizes="(max-width: 768px) 100vw, 50vw"
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
      <section className='py-20 px-4'>
        <div className='container mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold mb-4'>Our Journey</h2>
            <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
              From humble beginnings to global recognition, here&apos;s our
              story of growth and dedication
            </p>
          </div>
          <div className='max-w-4xl mx-auto'>
            <div className='space-y-8'>
              {timeline.map((item, index) => (
                <div key={index} className='flex gap-8 items-start group'>
                  <div className='flex flex-col items-center'>
                    <div className='bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform'>
                      <Clock className='w-6 h-6' />
                    </div>
                    {index !== timeline.length - 1 && (
                      <div className='w-0.5 h-full bg-border mt-2' />
                    )}
                  </div>
                  <Card className='flex-1 p-6 hover-shadow transition-all group-hover:scale-105'>
                    <div className='text-primary font-bold text-xl mb-2'>
                      {item.year}
                    </div>
                    <h3 className='text-2xl font-semibold mb-2'>
                      {item.title}
                    </h3>
                    <p className='text-muted-foreground'>{item.description}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className='py-20 px-4 bg-muted/30'>
        <div className='container mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold mb-4'>Meet Our Team</h2>
            <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
              The passionate individuals behind your extraordinary travel
              experiences
            </p>
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {team.map((member, index) => (
              <Card
                key={index}
                className='overflow-hidden p-0 hover-shadow transition-all hover:scale-105'>
                <div className='relative h-72 overflow-hidden'>
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className='object-cover transition-transform hover:scale-110'
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className='p-6 text-center'>
                  <h3 className='text-xl font-semibold mb-1'>{member.name}</h3>
                  <p className='text-muted-foreground'>{member.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-20 px-4'>
        <div className='container mx-auto'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
            {[
              { value: stats.happyTravelers, label: 'Happy Travelers', icon: Users },
              { value: stats.countries, label: 'Countries', icon: MapPin },
              { value: stats.tourPackages, label: 'Tour Packages', icon: Globe },
              { value: stats.yearsExperience, label: 'Years Experience', icon: Award },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className='p-6 text-center hover-shadow transition-all hover:scale-105'>
                  <Icon className='w-12 h-12 text-primary mx-auto mb-4' />
                  <div className='text-5xl font-bold text-primary mb-2'>
                    {stat.value}
                  </div>
                  <div className='text-muted-foreground font-medium'>
                    {stat.label}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
