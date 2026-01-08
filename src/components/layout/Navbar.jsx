'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Plane } from 'lucide-react';
import BookingAvatar from '../account/BookingAvatar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Blog', href: '/blogs' },
    { label: 'Destinations', href: '/destinations' },
    { label: 'Tours', href: '/tours' },
    { label: 'Flyer', href: '/flyer' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const router = useRouter();
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white lg:bg-background/95 lg:backdrop-blur-md lg:shadow-md'
          : 'bg-white lg:bg-transparent'
      }`}>
      <div className='container mx-auto relative'>
        <div className='flex items-center justify-between h-20'>
          {/* Logo */}
          <Link href='/' className='hidden lg:flex items-center px-4 gap-2'>
            {!isScrolled ? (
              <Image
                src='/assets/white-logo.png'
                alt='Logo'
                width={120}
                height={48}
                className='h-8 lg:h-12'
              />
            ) : (
              <Image src='/assets/logo.png' alt='Logo' width={120} height={48} className='h-8 lg:h-12' />
            )}
          </Link>
          <Link href='/' className='flex lg:hidden items-center px-4 gap-2'>
            <Image src='/assets/logo.png' alt='Logo' width={120} height={48} className='h-8 lg:h-12' />
          </Link>

          {/* Desktop Nav */}
          <div className='hidden lg:flex items-center gap-8'>
            {links.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`relative text-sm font-medium transition-all duration-300 ${
                  isScrolled
                    ? 'text-foreground hover:text-primary'
                    : 'text-white hover:text-white'
                } hover:tracking-wide group`}>
                {item.label}

                {/* Underline */}
                <span
                  className={`absolute left-0 -bottom-1 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    isScrolled ? 'bg-primary' : 'bg-white'
                  }`}></span>
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className='hidden lg:flex items-center gap-3'>
            <Button
              onClick={() => router.push('/tours')}
              className={
                isScrolled
                  ? 'text-white'
                  : 'bg-white text-primary hover:bg-white hover:text-primary'
              }
              size='lg'>
              Book Now
            </Button>
            <BookingAvatar isScrolled={isScrolled} />
          </div>

          {/* Mobile Menu Button */}
          <div className='flex items-center justify-center lg:hidden px-4 gap-2'>
            <BookingAvatar />
            <button
              className='px-4'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? (
                <X
                  className={`w-6 h-6 text-foreground ${
                    isScrolled ? 'lg:text-foreground' : 'lg:text-white'
                  }`}
                />
              ) : (
                <div className='flex items-center gap-2'>
                  <Menu
                    className={`w-6 h-6 text-foreground ${
                      isScrolled ? 'lg:text-foreground' : 'lg:text-white'
                    }`}
                  />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className='lg:hidden absolute left-0 right-0 top-full p-4 bg-background/95 backdrop-blur-md shadow-lg border-t border-border'>
            <div className='flex flex-col gap-4'>
              {links.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className='relative text-sm font-medium text-foreground hover:text-primary transition-all duration-300 hover:tracking-wide group'>
                  {item.label}
                  <span className='absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full'></span>
                </a>
              ))}

              <Button onClick={() => router.push('/tours')} variant='default' size='lg' className='w-full'>
                Book Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
