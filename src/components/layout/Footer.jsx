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
      className='border-t border-white/15 bg-primary text-white'>
      <div className='container mx-auto px-4 md:px-10 lg:px-16 py-12 space-y-10'>
        {/* CTA strip */}
        <div className='flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg shadow-black/20 px-6 py-6 text-center lg:text-left'>
          <div className='flex items-center lg:items-start gap-4'>
            <div className='h-12 w-12 min-h-12 min-w-12 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0'>
              <Plane className='h-6 w-6' />
            </div>
            <div>
              <p className='text-xs uppercase tracking-[0.18em] text-white/75'>
                Your journey, curated
              </p>
              <h3 className='font-heading text-xl md:text-2xl font-semibold leading-snug tracking-tight'>
                {footer?.heading || 'Travel stories start here.'}
              </h3>
              <p className='text-sm text-white/80 mt-2 max-w-2xl'>
                {footer?.brief ||
                  'Handpicked experiences, flexible payments, and humans who care about your itinerary.'}
              </p>
            </div>
          </div>
          <Link
            href='/contact'
            className='inline-flex items-center justify-center rounded-full bg-white text-primary px-5 py-3 font-semibold shadow-lg shadow-black/25 hover:shadow-black/35 transition-all self-center lg:self-auto'>
            Plan My Trip
          </Link>
        </div>

        {/* main grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center sm:text-left'>
          <div className='space-y-4 flex flex-col items-center sm:items-start'>
            <Image
              src='/assets/white-logo.png'
              alt='Logo'
              width={150}
              height={60}
              className='h-auto drop-shadow-sm'
            />
            <p className='text-white/80 leading-relaxed'>
              {footer?.brief ||
                'Designing seamless getaways with local expertise and global standards.'}
            </p>
            {socials.length > 0 && (
              <div className='flex gap-3'>
                {socials.map(({ icon: Icon, href, id }) => (
                  <a
                    key={id}
                    href={href}
                    target='_blank'
                    rel='noreferrer'
                    className='h-10 w-10 rounded-full border border-white/25 bg-white/15 flex items-center justify-center text-white/80 hover:text-white hover:border-white/60 transition-colors backdrop-blur'>
                    <Icon className='h-5 w-5' />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className='lg:ml-20'>
            <h4 className='font-heading text-lg font-semibold mb-4 tracking-tight'>Explore</h4>
            <div className='grid gap-3 text-white/80'>
              {quickLinks.map((item, idx) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className='inline-flex max-md:mx-auto   max-md:w-fit  items-center gap-2 hover:text-white transition-colors'>
                  <span className='h-1.5 w-1.5 rounded-full bg-white/70' />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className='lg:ml-20'>
            <h4 className='font-heading text-lg font-semibold mb-4 tracking-tight'>Support</h4>
            <div className='grid gap-3 text-white/80'>
              {supportLinks.map((item, idx) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className='inline-flex  max-md:mx-auto  max-md:w-fit items-center gap-2 hover:text-white transition-colors'>
                  <span className='h-1.5 w-1.5 rounded-full bg-white/70' />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className='space-y-3 lg:ml-20'>
            <h4 className='font-heading text-lg font-semibold tracking-tight'>Contact</h4>
            <div className='space-y-3 text-white/80'>
              <div>
                <p className='text-xs uppercase tracking-[0.15em] text-white/70 mb-1'>
                  Email
                </p>
                <a
                  href={footer?.email ? `mailto:${footer.email}` : '#'}
                  className='hover:text-white transition-colors'>
                  {footer?.email || 'hello@galaxytravel.com'}
                </a>
              </div>
              <div>
                <p className='text-xs uppercase tracking-[0.15em] text-white/70 mb-1'>
                  Phone
                </p>
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
              <div>
                <p className='text-xs uppercase tracking-[0.15em] text-white/70 mb-1'>
                  Address
                </p>
                <p className='leading-relaxed'>
                  {footer?.location || 'HQ: Mumbai, India'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className='border-t border-white/20 pt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-white/75'>
          <p className='flex items-center gap-1 '>
            © 2025–{new Date().getFullYear()} GalaxyTravel | Crafted for
            explorers by <Heart size={17} fill='red' className='text-red-500' />{' '}
            <Link className='underline' href='https://webitof.com'>
              Webitof.
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
