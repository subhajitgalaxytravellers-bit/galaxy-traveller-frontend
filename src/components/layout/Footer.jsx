'use client';
import client from '@/api/client';
import { Plane, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const Footer = ({ footer, global }) => {
  return (
    <footer id='contact' className='bg-white/30  pt-16 pb-8'>
      <div className='container mx-auto px-4 md:px-16'>
        <div className=' grid grid-cols-1 lg:grid-cols-4 space-y-12 mb-12'>
          {/* Brand */}
          <div className='max-lg:px-4 max-lg:text-center max-lg:items-center'>
            <div className='flex items-center gap-2 mb-4 max-lg:justify-center'>
              <Image src='/assets/logo.png' alt='Logo' width={150} height={48} className='h-12' />
            </div>
            <p className='text-muted-foreground mb-6'> {footer?.brief || ''}</p>
            <div className='flex gap-4 justify-center lg:justify-start'>
              {global.facebook && (
                <a
                  href={global.facebook}
                  className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors'>
                  <Facebook className='w-5 h-5' />
                </a>
              )}
              {global.instagram && (
                <a
                  href={global.instagram}
                  className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors'>
                  <Instagram className='w-5 h-5' />
                </a>
              )}
              {global.twitter && (
                <a
                  href={global.twitter}
                  className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors'>
                  <Twitter className='w-5 h-5' />
                </a>
              )}
              {global.youtube && (
                <a
                  href={global.youtube}
                  className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors'>
                  <Youtube className='w-5 h-5' />
                </a>
              )}
            </div>
          </div>

          <div className='px-4  flex max-lg:flex-col max-lg:items-center max-lg:text-center  justify-between col-span-1 md:col-span-2 lg:col-span-3 w-full'>
            {/* Quick Links */}
            <div className='max-lg:text-center'>
              <h3 className='text-lg font-bold mb-4'>Quick Links</h3>
              <ul className='my-3'>
                <li>
                  <Link
                    href='/about'
                    className='text-muted-foreground hover:text-primary transition-colors'>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href='/destinations'
                    className='text-muted-foreground hover:text-primary transition-colors'>
                    Destinations
                  </Link>
                </li>
                <li>
                  <Link
                    href='/tours'
                    className='text-muted-foreground hover:text-primary transition-colors'>
                    Tours
                  </Link>
                </li>
                <li>
                  <Link
                    href='/blogs'
                    className='text-muted-foreground hover:text-primary transition-colors'>
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href='/contact'
                    className='text-muted-foreground hover:text-primary transition-colors'>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className='text-lg font-bold mb-4'>Support</h3>
              <ul className='my-3'>
                <li>
                  <a
                    href='/contact'
                    className='text-muted-foreground hover:text-primary transition-colors'>
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href='/policy'
                    className='text-muted-foreground hover:text-primary transition-colors'>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href='/terms'
                    className='text-muted-foreground hover:text-primary transition-colors'>
                    Terms of Service
                  </a>
                </li>
                {/* <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQs
                </a>
              </li> */}
                {/* <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Travel Insurance
                </a>
              </li> */}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className='text-lg font-bold mb-4'>Contact Us</h3>

              <ul className='my-3 text-muted-foreground'>
                {/* Email */}
                <li className='mb-4'>
                  <p className='font-medium text-foreground mb-1'>Email</p>
                  <a
                    href={`mailto:${footer?.email}`}
                    className='hover:text-primary transition-colors'>
                    {footer?.email || 'Not available'}
                  </a>
                </li>

                {/* Phone */}
                <li className='mb-4'>
                  <p className='font-medium text-foreground mb-1'>Phone</p>

                  {/* primary contact */}
                  {footer?.contact1 && (
                    <a
                      href={`tel:${footer.contact1}`}
                      className='hover:text-primary transition-colors block'>
                      {footer.contact1}
                    </a>
                  )}

                  {/* secondary contact */}
                  {footer?.contact2 && (
                    <a
                      href={`tel:${footer.contact2}`}
                      className='hover:text-primary transition-colors block mt-1'>
                      {footer.contact2}
                    </a>
                  )}
                </li>

                {/* Address */}
                <li>
                  <p className='font-medium text-foreground mb-1'>Address</p>
                  <p>{footer?.location || 'No address available'}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className='border-t border-border pt-8'>
          <p className='text-center text-muted-foreground'>
            © {new Date().getFullYear()} GalaxyTravel. All rights reserved.
            Built with ❤️ for travelers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
