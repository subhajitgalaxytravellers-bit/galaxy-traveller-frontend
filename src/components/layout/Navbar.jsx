'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, ArrowRight, ChevronRight, MapPin, Globe2, Compass } from 'lucide-react';
import BookingAvatar from '../account/BookingAvatar';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import AuthDialog from '@/components/Auth/authDialog';
import { isAuthenticated, subscribeAuthChanges } from '@/lib/auth';

/** "South Asia" → "south-asia" */
function slugify(str) {
  return String(str || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function fetchTourGroups() {
  try {
    const base = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');
    const res = await fetch(`${base}/api/categories/tour-groups`);
    if (!res.ok) return [];
    return (await res.json())?.data?.items || [];
  } catch { return []; }
}

async function fetchDestinationGroups() {
  try {
    const base = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');
    const res = await fetch(`${base}/api/site_destinationsList`);
    if (!res.ok) return [];
    return (await res.json())?.data?.group || [];
  } catch { return []; }
}

/* ═══════════════════════════════════════════════════════
   TOURS MEGA MENU — Premium
═══════════════════════════════════════════════════════ */
function ToursMegaMenu({ groups }) {
  if (!groups || groups.length === 0) return null;

  const featured = groups[0];
  const rest = groups.slice(0, 6);

  return (
    <div className='absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50' style={{ width: 'min(960px, 96vw)' }}>
      <div className='mega-menu-animate relative'>
        {/* Arrow pointer */}
        <div className='absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-border/60 shadow-sm z-10' />

        <div className='relative overflow-hidden rounded-2xl bg-white border border-border/60 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18)]'>
          {/* Top accent bar */}
          <div className='h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30' />

          <div className='flex'>
            {/* ── LEFT SPOTLIGHT ── */}
            <div className='w-[270px] flex-shrink-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-r border-border/50 p-6 flex flex-col justify-between'>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <div className='w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <Compass className='w-3.5 h-3.5 text-primary' />
                  </div>
                  <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-primary'>Tour Packages</span>
                </div>
                <h3 className='font-heading text-xl font-bold text-foreground mt-4 leading-snug'>
                  Find Your Perfect<br />Adventure
                </h3>
                <p className='text-xs text-muted-foreground mt-2 leading-relaxed'>
                  Curated itineraries across the world's most iconic destinations.
                </p>
              </div>

              {featured && (
                <Link
                  href={`/tours/${featured.tag}`}
                  className='group mt-6 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5'
                >
                  <div>
                    <p className='text-[10px] font-semibold uppercase tracking-widest opacity-75'>Featured</p>
                    <p className='font-heading text-sm font-bold mt-0.5'>{featured.name || featured.tag}</p>
                  </div>
                  <ArrowRight className='w-4 h-4 opacity-75 group-hover:translate-x-1 transition-transform' />
                </Link>
              )}

              <Link href='/tours' className='mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary hover:gap-3 transition-all'>
                <span>Browse all tours</span>
                <ArrowRight className='w-3.5 h-3.5' />
              </Link>
            </div>

            {/* ── RIGHT GRID ── */}
            <div className='flex-1 p-6'>
              <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4'>
                Explore by Category
              </p>
              <div className='grid grid-cols-3 gap-6'>
                {rest.map((group) => {
                  const regionCount = (group.regions || []).length;
                  return (
                    <div key={group.tag} className='min-w-0'>
                      <Link href={`/tours/${group.tag}`} className='group/link flex items-center gap-2 mb-3'>
                        <div className='w-7 h-7 rounded-lg bg-muted group-hover/link:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors'>
                          <Globe2 className='w-3.5 h-3.5 text-muted-foreground group-hover/link:text-primary transition-colors' />
                        </div>
                        <p className='font-heading text-sm font-semibold text-foreground group-hover/link:text-primary transition-colors truncate'>
                          {group.name || group.tag}
                        </p>
                      </Link>

                      <ul className='space-y-2 pl-9'>
                        {(group.regions || []).map((region) => (
                          <li key={region.tag}>
                            <Link
                              href={`/tours/${group.tag}/${region.tag}`}
                              className='block text-xs text-muted-foreground hover:text-primary transition-colors truncate'
                            >
                              {region.name || region.tag}
                            </Link>
                          </li>
                        ))}
                        {regionCount === 0 && (
                          <li>
                            <Link
                              href={`/tours/${group.tag}`}
                              className='block text-xs text-muted-foreground hover:text-primary transition-colors truncate'
                            >
                              View packages
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── BOTTOM BAR ── */}
          <div className='flex items-center justify-between border-t border-border/50 bg-muted/20 px-6 py-3'>
            <p className='text-[11px] text-muted-foreground'>✦ New tours added every season</p>
            <Link href='/tours' className='inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-all'>
              <span>All Tour Packages</span>
              <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DESTINATIONS MEGA MENU — Premium
═══════════════════════════════════════════════════════ */
function DestinationsMegaMenu({ groups }) {
  if (!groups || groups.length === 0) return null;

  const featured = groups[0];
  const displayGroups = groups.slice(0, 9);

  return (
    <div className='absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50' style={{ width: 'min(880px, 96vw)' }}>
      <div className='mega-menu-animate relative'>
        {/* Arrow pointer */}
        <div className='absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-border/60 shadow-sm z-10' />

        <div className='relative overflow-hidden rounded-2xl bg-white border border-border/60 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18)]'>
          {/* Top accent bar */}
          <div className='h-1 w-full bg-gradient-to-r from-emerald-500 via-primary to-primary/40' />

          <div className='flex'>
            {/* ── LEFT SPOTLIGHT ── */}
            <div className='w-[260px] flex-shrink-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-r border-border/50 p-6 flex flex-col justify-between'>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <div className='w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <MapPin className='w-3.5 h-3.5 text-primary' />
                  </div>
                  <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-primary'>Destinations</span>
                </div>
                <h3 className='font-heading text-xl font-bold text-foreground mt-4 leading-snug'>
                  Explore the<br />World with Us
                </h3>
                <p className='text-xs text-muted-foreground mt-2 leading-relaxed'>
                  Handpicked collections spanning every continent and corner of the globe.
                </p>
              </div>

              {featured && (
                <Link
                  href={`/destinations/${slugify(featured.title)}`}
                  className='group mt-6 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5'
                >
                  <div>
                    <p className='text-[10px] font-semibold uppercase tracking-widest opacity-75'>Popular</p>
                    <p className='font-heading text-sm font-bold mt-0.5'>{featured.title}</p>
                  </div>
                  <ArrowRight className='w-4 h-4 opacity-75 group-hover:translate-x-1 transition-transform' />
                </Link>
              )}

              <Link href='/destinations' className='mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary hover:gap-3 transition-all'>
                <span>All destinations</span>
                <ArrowRight className='w-3.5 h-3.5' />
              </Link>
            </div>

            {/* ── RIGHT GRID ── */}
            <div className='flex-1 p-6'>
              <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4'>
                Explore by Region
              </p>
              <div className='grid grid-cols-3 gap-1.5'>
                {displayGroups.map((group, i) => {
                  const count = Array.isArray(group.destinations) ? group.destinations.length : 0;
                  return (
                    <Link
                      key={group.title}
                      href={`/destinations/${slugify(group.title)}`}
                      className='group flex items-center gap-3 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 p-3 transition-all duration-200'
                    >
                      <div className='w-7 h-7 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors'>
                        <span className='text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors'>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate leading-tight'>
                          {group.title}
                        </p>
                        {count > 0 && (
                          <p className='text-[11px] text-muted-foreground mt-0.5'>
                            {count} destination{count !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <ChevronRight className='w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 group-hover:text-primary -translate-x-1 group-hover:translate-x-0 transition-all flex-shrink-0' />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── BOTTOM BAR ── */}
          <div className='flex items-center justify-between border-t border-border/50 bg-muted/20 px-6 py-3'>
            <p className='text-[11px] text-muted-foreground'>✦ Handpicked destinations across all continents</p>
            <Link href='/destinations' className='inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-all'>
              <span>All Destinations</span>
              <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MOBILE MENUS
═══════════════════════════════════════════════════════ */
function MobileTourMenu({ groups, onClose }) {
  const [open, setOpen] = useState(null);

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-muted/20'>
      <div className='flex items-center justify-between px-4 py-3'>
        <span className='flex min-w-0 flex-1 items-center gap-2 font-heading text-sm font-semibold text-foreground'>
          <Compass className='w-4 h-4 text-primary' />
          Tours
        </span>
        <button
          type='button'
          className='ml-3 flex-shrink-0'
          onClick={() => setOpen(open === 'root' ? null : 'root')}
        >
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open === 'root' ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open === 'root' && (
        <div className='border-t border-border/50 bg-background/60 px-3 pb-3 pt-2 space-y-1'>
          <Link href='/tours' onClick={onClose} className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors'>
            <ArrowRight className='w-3.5 h-3.5' />
            All Tours
          </Link>
          {(groups || []).map((group) => (
            <div key={group.tag} className='rounded-xl overflow-hidden'>
              <button
                className='flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70 transition-colors rounded-xl'
                onClick={() => setOpen(open === group.tag ? 'root' : group.tag)}
              >
                <span className='truncate'>{group.name || group.tag}</span>
                {(group.regions || []).length > 0 && (
                  <div className='flex items-center gap-1 ml-2 flex-shrink-0'>
                    <span className='text-[10px] text-muted-foreground'>{group.regions.length}</span>
                    <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open === group.tag ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </button>
              {open === group.tag && (group.regions || []).length > 0 && (
                <div className='mx-3 mb-2 flex flex-wrap gap-1.5'>
                  {group.regions.map((region) => (
                    <Link
                      key={region.tag}
                      href={`/tours/${group.tag}/${region.tag}`}
                      onClick={onClose}
                      className='px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground hover:bg-primary hover:text-white transition-all'
                    >
                      {region.name || region.tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileDestinationMenu({ groups, onClose }) {
  const [open, setOpen] = useState(false);

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-muted/20'>
      <div className='flex items-center justify-between px-4 py-3'>
        <span className='flex min-w-0 flex-1 items-center gap-2 font-heading text-sm font-semibold text-foreground cursor-pointer' onClick={onClose}>
          <MapPin className='w-4 h-4 text-primary' />
          Destinations
        </span>
        <button
          type='button'
          className='ml-3 flex-shrink-0'
          onClick={() => setOpen(!open)}
        >
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className='border-t border-border/50 bg-background/60 px-3 pb-3 pt-2 space-y-1'>
          <Link href='/destinations' onClick={onClose} className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors'>
            <ArrowRight className='w-3.5 h-3.5' />
            All Destinations
          </Link>
          {(groups || []).map((group) => {
            const count = Array.isArray(group.destinations) ? group.destinations.length : 0;
            return (
              <Link
                key={group.title}
                href={`/destinations/${slugify(group.title)}`}
                onClick={onClose}
                className='flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70 hover:text-primary transition-colors'
              >
                <span className='truncate'>{group.title}</span>
                {count > 0 && (
                  <span className='ml-2 text-[10px] text-muted-foreground flex-shrink-0'>{count}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN NAVBAR
═══════════════════════════════════════════════════════ */
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tourGroups, setTourGroups] = useState([]);
  const [destinationGroups, setDestinationGroups] = useState([]);
  const [megaOpen, setMegaOpen] = useState(false);
  const [destMegaOpen, setDestMegaOpen] = useState(false);
  const megaRef = useRef(null);
  const destMegaRef = useRef(null);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const sync = () => setIsLoggedIn(isAuthenticated());
    sync();
    const unsubscribe = subscribeAuthChanges(sync);
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchTourGroups().then(setTourGroups);
    fetchDestinationGroups().then(setDestinationGroups);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (destMegaRef.current && !destMegaRef.current.contains(e.target)) setDestMegaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const staticLinks = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blogs' },
    { label: 'Flyer', href: '/flyer' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const router = useRouter();
  const pathname = usePathname();
  const useColoredDesktopLogo = isScrolled || pathname === '/';

  const isActive = (href = '') => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isTourActive = pathname === '/tours' || pathname.startsWith('/tours/');
  const isDestActive = pathname === '/destinations' || pathname.startsWith('/destinations/');

  const desktopLinkClass = (active) =>
    `relative group font-heading text-sm font-medium tracking-wide transition-all duration-300 ${isScrolled
      ? active ? 'text-primary' : 'text-foreground hover:text-primary'
      : 'text-white hover:text-white/80'
    } ${active ? 'tracking-widest' : ''}`;

  const underlineClass = (active) =>
    `absolute left-0 -bottom-1 h-0.5 transition-all duration-300 ${isScrolled ? 'bg-primary' : 'bg-white'} ${active ? 'w-full' : 'w-0'} group-hover:w-full`;

  return (
    <nav
      // className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 lg:px-4 ${
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 lg:px-4 ${isScrolled
        ? 'bg-white lg:bg-background/95 lg:backdrop-blur-md lg:shadow-sm lg:border-b lg:border-border/40'
        : 'bg-white lg:bg-transparent'
        }`}
    >
      <div className='container relative mx-auto'>
        <div className='flex h-16 items-center justify-between lg:h-20'>
          {/* Logo desktop */}
          <Link href='/' className='hidden items-center gap-2 px-9 lg:flex'>
            {!useColoredDesktopLogo ? (
              <Image src='/assets/white-logo.png' alt='Logo' width={120} height={48} className='h-8 w-auto lg:h-14' />
            ) : (
              <Image src='/assets/logo.png' alt='Logo' width={120} height={48} className='h-8 w-auto lg:h-14' />
            )}
          </Link>

          {/* Logo mobile */}
          <Link href='/' className='flex items-center gap-2 px-4 lg:hidden'>
            <Image src='/assets/logo.png' alt='Logo' width={80} height={50} className='h-8 w-auto' />
          </Link>

          {/* ── DESKTOP NAV ── */}
          <div className='hidden items-center gap-7 lg:flex'>
            {/* Home */}
            <a href='/' className={desktopLinkClass(isActive('/'))}>
              Home
              <span className={underlineClass(isActive('/'))} />
            </a>

            {/* Blog */}
            <a href='/blogs' className={desktopLinkClass(isActive('/blogs'))}>
              Blog
              <span className={underlineClass(isActive('/blogs'))} />
            </a>

            {/* ── DESTINATIONS DROPDOWN ── */}
            <div
              ref={destMegaRef}
              className='relative'
              onMouseEnter={() => setDestMegaOpen(true)}
              onMouseLeave={() => setDestMegaOpen(false)}
            >
              <button
                onClick={() => router.push('/destinations')}
                className={`cursor-pointer relative group flex items-center gap-1 font-heading text-sm font-medium tracking-wide transition-all duration-300 ${isScrolled
                  ? isDestActive ? 'text-primary' : 'text-foreground hover:text-primary'
                  : 'text-white hover:text-white/80'
                  } ${isDestActive ? 'tracking-widest' : ''}`}
              >
                Destinations
                <span className={underlineClass(isDestActive)} />
              </button>

              {destMegaOpen && (
                <DestinationsMegaMenu groups={destinationGroups} />
              )}
            </div>

            {/* ── TOURS DROPDOWN ── */}
            <div
              ref={megaRef}
              className='relative'
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button
                onClick={() => router.push('/tours')}
                className={`cursor-pointer relative group flex items-center gap-1 font-heading text-sm font-medium tracking-wide transition-all duration-300 ${isScrolled
                  ? isTourActive ? 'text-primary' : 'text-foreground hover:text-primary'
                  : 'text-white hover:text-white/80'
                  } ${isTourActive ? 'tracking-widest' : ''}`}
              >
                Tours
                <span className={underlineClass(isTourActive)} />
              </button>

              {megaOpen && (
                <ToursMegaMenu groups={tourGroups} />
              )}
            </div>

            {/* Flyer, About, Contact */}
            {staticLinks.slice(2).map((item) => (
              <a key={item.label} href={item.href} className={desktopLinkClass(isActive(item.href))}>
                {item.label}
                <span className={underlineClass(isActive(item.href))} />
              </a>
            ))}
          </div>

          {/* CTA — desktop */}
          <div className='hidden items-center gap-3 lg:flex'>
            <Button
              onClick={() => {
                if (!isLoggedIn) { setAuthOpen(true); return; }
                router.push('/tours');
              }}
              className={
                isScrolled
                  ? 'font-heading tracking-tight text-white'
                  : 'font-heading tracking-tight bg-white text-primary hover:bg-white hover:text-primary'
              }
              size='lg'
            >
              {isLoggedIn ? 'Book Now' : 'Login'}
            </Button>
            <BookingAvatar isScrolled={isScrolled} />
          </div>

          {/* Mobile controls */}
          <div className='flex items-center justify-center gap-2 px-4 lg:hidden'>
            <BookingAvatar isScrolled={true} />
            <button className='px-4' onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen
                ? <X className='h-6 w-6 text-foreground' />
                : <Menu className='h-6 w-6 text-foreground' />}
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        {isMobileMenuOpen && (
          <div className='absolute left-0 right-0 top-full border-t border-border bg-background/98 p-4 shadow-xl backdrop-blur-md lg:hidden'>
            <div className='flex flex-col gap-2'>
              {['/', '/blogs'].map((href) => {
                const label = href === '/' ? 'Home' : 'Blog';
                return (
                  <a
                    key={href}
                    href={href}
                    className={`px-2 py-2 font-heading text-sm font-medium rounded-lg transition-colors ${isActive(href) ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-muted/50'
                      }`}
                  >
                    {label}
                  </a>
                );
              })}

              <MobileDestinationMenu groups={destinationGroups} onClose={() => setIsMobileMenuOpen(false)} />
              <MobileTourMenu groups={tourGroups} onClose={() => setIsMobileMenuOpen(false)} />

              {staticLinks.slice(2).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`px-2 py-2 font-heading text-sm font-medium rounded-lg transition-colors ${isActive(item.href) ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-muted/50'
                    }`}
                >
                  {item.label}
                </a>
              ))}

              <div className='pt-2 border-t border-border mt-1'>
                <Button
                  onClick={() => {
                    if (!isLoggedIn) { setAuthOpen(true); return; }
                    router.push('/tours');
                  }}
                  size='lg'
                  className='w-full font-heading tracking-tight'
                >
                  {isLoggedIn ? 'Book Now' : 'Login'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </nav>
  );
};

export default Navbar;
