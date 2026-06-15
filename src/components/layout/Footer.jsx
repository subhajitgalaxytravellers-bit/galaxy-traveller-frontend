'use client';

import {
  Plane,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  HeartHandshakeIcon,
  HeartHandshake,
  Heart,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Primary-toned, glassy footer
const Footer = ({ footer = {}, global = {} }) => {
  const emails = [footer?.email1 || footer?.email, footer?.email2].filter(Boolean);
  const locations = [
    footer?.location1 || footer?.location,
    // footer?.location2,
    // footer?.location3,
  ].filter(Boolean);

  const quickLinks = [
    { id: 'q1', label: 'About', href: '/about' },
    { id: 'q2', label: 'Destinations', href: '/destinations' },
    { id: 'q3', label: 'Tours', href: '/tours' },
    { id: 'q4', label: 'Blog', href: '/blogs' },
    { id: 'q5', label: 'Contact', href: '/contact' },
  ];

  const supportLinks = [
    { id: 's1', label: 'Help Center', href: '/contact' },
    { id: 's2', label: 'Privacy Policy', href: '/policy' },
    { id: 's3', label: 'Terms of Service', href: '/terms' },
  ];

  const socials = [
    { id: 'f', icon: Facebook, href: global.facebook },
    { id: 'i', icon: Instagram, href: global.instagram },
    { id: 't', icon: Twitter, href: global.twitter },
    { id: 'y', icon: Youtube, href: global.youtube },
  ].filter((s) => !!s.href);

  return (
    <footer
      id='contact'
      className='border-t border-white/10 bg-gradient-to-b from-[#045861] to-[#022c30] text-white'>
      <div className='container mx-auto px-4 md:px-10 lg:px-16 py-12 space-y-10'>
        {/* CTA strip */}
        <div className='flex flex-col lg:flex-row items-center justify-between gap-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-xl px-8 py-8 text-center lg:text-left w-full mx-auto'>
          <div className='flex flex-col lg:flex-row items-center gap-5'>
            <div className='h-14 w-14 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20 shadow-inner'>
              <Plane className='h-6 w-6' />
            </div>
            <div>
              <p className='text-[11px] uppercase tracking-[0.2em] text-white/60 font-semibold mb-1'>
                Your journey, curated
              </p>
              <h3 className='font-heading text-2xl md:text-3xl font-bold tracking-tight'>
                {footer?.heading || 'Travel stories start here.'}
              </h3>
              <p className='text-sm text-white/70 mt-2 max-w-xl'>
                {footer?.brief ||
                  'Handpicked experiences, flexible payments, and humans who care about your itinerary.'}
              </p>
            </div>
          </div>
          <Link
            href='/contact'
            className='inline-flex items-center justify-center rounded-full bg-white text-[#045861] px-8 py-3.5 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all'>
            Plan My Trip
          </Link>
        </div>

        {/* main grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 text-left w-full mx-auto'>
          <div className='flex flex-col items-start lg:text-left space-y-5'>
            <Image
              src='/assets/white-logo.png'
              alt='Logo'
              width={160}
              height={64}
              className='h-auto drop-shadow-sm'
            />
            <p className='text-white/70 text-sm leading-relaxed'>
              {footer?.brief ||
                'Designing seamless getaways with local expertise and global standards.'}
            </p>
            {socials.length > 0 && (
              <div className='flex gap-3 pt-1'>
                {socials.map(({ icon: Icon, href, id }) => (
                  <a
                    key={id}
                    href={href}
                    target='_blank'
                    rel='noreferrer'
                    className='h-10 w-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 hover:scale-110 transition-all backdrop-blur'>
                    <Icon className='h-5 w-5' />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className='flex flex-col items-start'>
            <h4 className='font-heading text-base font-semibold mb-6 tracking-wider text-white/90 uppercase'>Explore</h4>
            <div className='flex flex-col gap-3.5 text-sm text-white/70'>
              {quickLinks.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className='flex items-center gap-2 hover:text-white hover:-translate-y-0.5 transition-all'>
                  <span className='h-1.5 w-1.5 rounded-full bg-white/70 shrink-0' />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className='flex flex-col items-start'>
            <h4 className='font-heading text-base font-semibold mb-6 tracking-wider text-white/90 uppercase'>Support</h4>
            <div className='flex flex-col gap-3.5 text-sm text-white/70'>
              {supportLinks.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className='flex items-center gap-2 hover:text-white hover:-translate-y-0.5 transition-all'>
                  <span className='h-1.5 w-1.5 rounded-full bg-white/70 shrink-0' />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className='flex flex-col items-start'>
            <h4 className='font-heading text-base font-semibold mb-6 tracking-wider text-white/90 uppercase'>Contact</h4>
            <div className='flex flex-col gap-4 text-sm text-white/70'>
              <div className='flex flex-col gap-1'>
                {emails.length > 0 ? (
                  emails.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      className='hover:text-white transition-colors'
                    >
                      {email}
                    </a>
                  ))
                ) : (
                  <a href='mailto:hello@galaxytravel.com' className='hover:text-white transition-colors'>
                    hello@galaxytravel.com
                  </a>
                )}
              </div>
              <div className='flex flex-col gap-1'>
                {footer?.contact1 && (
                  <a
                    href={`tel:${footer.contact1}`}
                    className='block hover:text-white transition-colors'>
                    {footer.contact1}
                  </a>
                )}
                {footer?.contact2 && (
                  <a
                    href={`tel:${footer.contact2}`}
                    className='block hover:text-white transition-colors'>
                    {footer.contact2}
                  </a>
                )}
                {!footer?.contact1 && !footer?.contact2 && (
                  <p>+91 98765 43210</p>
                )}
              </div>
              <div className='flex flex-col gap-1'>
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <p key={location} className='leading-relaxed'>
                      {location}
                    </p>
                  ))
                ) : (
                  <p className='leading-relaxed'>HQ: Mumbai, India</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className='border-t border-white/10 pt-8 flex flex-col items-center justify-center text-sm text-white/60 text-center gap-2'>
          <p className='flex items-center gap-1.5'>
            © 2025–{new Date().getFullYear()} GalaxyTravel | Crafted for
            explorers by <Heart size={15} fill='currentColor' className='text-red-500' />{' '}
            <Link className='underline hover:text-white transition-colors' href='https://webitof.com'>
              Webitof
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
