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
   TOURS MEGA MENU — Professional Clean Layout
═══════════════════════════════════════════════════════ */
function ToursMegaMenu({ groups }) {
  if (!groups || groups.length === 0) return null;

  const featured = groups[0];
  const groupCount = groups.length;

  // Dynamically balance grid columns based on number of tour groups
  const gridColsClass =
    groupCount <= 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto'
      : groupCount === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  const containerWidth =
    groupCount <= 3
      ? 'min(820px, 96vw)'
      : 'min(1040px, 96vw)';

  return (
    <div className='absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50' style={{ width: containerWidth }}>
      <div className='mega-menu-animate relative'>
        {/* Arrow pointer */}
        <div className='absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-200 shadow-xs z-10' />

        <div className='relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.16)]'>
          {/* Top accent bar */}
          <div className='h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-emerald-500' />

          {/* ── BALANCED DIRECTORY GRID ── */}
          <div className='p-7 sm:p-8 bg-white'>
            <div className={`grid ${gridColsClass} gap-x-8 gap-y-7 max-h-[490px] overflow-y-auto pr-1 no-scrollbar`}>
              {groups.map((group) => {
                const regions = Array.isArray(group.regions) ? group.regions : [];
                return (
                  <div key={group.tag} className='min-w-0 flex flex-col'>
                    {/* Category Header */}
                    <Link
                      href={`/tours/${group.tag}`}
                      className='group/head flex items-center gap-2 mb-3 hover:opacity-85 transition-opacity'
                    >
                      <span className='w-2 h-2 rounded-[2px] bg-[#65a30d] shrink-0 group-hover/head:scale-125 transition-transform' />
                      <h4 className='font-heading text-xs font-bold uppercase tracking-wider text-[#0f2d4a] group-hover/head:text-primary transition-colors leading-tight'>
                        {group.name || group.tag}
                      </h4>
                    </Link>

                    {/* Listings under category */}
                    <ul className='space-y-1.5 pl-3.5 border-l border-slate-100'>
                      {regions.map((region) => (
                        <li key={region.tag}>
                          <Link
                            href={`/tours/${group.tag}/${region.tag}`}
                            className='block text-[13px] text-slate-600 hover:text-primary hover:translate-x-0.5 transition-all py-0.5 leading-snug'
                          >
                            {region.name || region.tag}
                          </Link>
                        </li>
                      ))}
                      {regions.length === 0 && (
                        <li>
                          <Link
                            href={`/tours/${group.tag}`}
                            className='block text-xs text-slate-400 hover:text-primary transition-colors italic py-0.5'
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

          {/* ── BOTTOM ACCENT BAR ── */}
          <div className='flex flex-wrap items-center justify-between border-t border-slate-100 bg-slate-50/90 px-7 sm:px-8 py-3.5 gap-4'>
            <div className='flex items-center gap-3'>
              <div className='w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0'>
                <Compass className='w-3.5 h-3.5' />
              </div>
              <p className='text-xs text-slate-600 font-medium'>
                <span className='font-semibold text-slate-900'>Curated Adventures:</span> Handpicked tour packages across the world&apos;s most iconic destinations.
              </p>
            </div>

            <div className='flex items-center gap-3 ml-auto'>
              {featured && (
                <Link
                  href={`/tours/${featured.tag}`}
                  className='hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary bg-white border border-slate-200 hover:border-primary/40 px-3 py-1.5 rounded-full transition-all shadow-2xs'
                >
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                  <span>Featured: <strong className='text-slate-900 font-bold'>{featured.name || featured.tag}</strong></span>
                </Link>
              )}
              <Link
                href='/tours'
                className='inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-4 py-1.5 rounded-full transition-all shadow-sm'
              >
                <span>All Tour Packages</span>
                <ArrowRight className='w-3 h-3' />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DESTINATIONS MEGA MENU — Professional Clean Layout
═══════════════════════════════════════════════════════ */
function DestinationsMegaMenu({ groups }) {
  if (!groups || groups.length === 0) return null;

  const displayGroups = groups;
  const featured = displayGroups.reduce((best, group) => {
    const bestCount = Array.isArray(best?.destinations) ? best.destinations.length : -1;
    const groupCount = Array.isArray(group?.destinations) ? group.destinations.length : 0;
    return groupCount > bestCount ? group : best;
  }, null);

  // Dynamically calculate required columns based on actual vertical packing
  const weights = displayGroups.map(
    (g) => (Array.isArray(g.destinations) ? Math.max(g.destinations.length, 1) : 1) + 2.5
  );
  const maxSingle = Math.max(...weights, 1);
  const colCapacity = Math.max(maxSingle, 18);

  let calculatedCols = 1;
  let currentHeight = 0;
  for (const w of weights) {
    if (currentHeight + w > colCapacity && currentHeight > 0) {
      calculatedCols++;
      currentHeight = w;
    } else {
      currentHeight += w;
    }
  }
  const optimalCols = Math.min(6, Math.max(1, calculatedCols));

  const calculatedWidth = optimalCols * 225 + (optimalCols - 1) * 28 + 64;
  const containerWidth = `min(${calculatedWidth}px, 96vw)`;

  return (
    <div className='absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50' style={{ width: containerWidth }}>
      <div className='mega-menu-animate relative'>
        {/* Arrow pointer */}
        <div className='absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-200 shadow-xs z-10' />

        <div className='relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.16)]'>
          {/* Top accent bar */}
          <div className='h-1 w-full bg-gradient-to-r from-emerald-500 via-primary to-primary/40' />

          {/* ── FULL WIDTH MASONRY DIRECTORY (Dynamic Columns) ── */}
          <div className='p-7 sm:p-8 bg-white'>
            <div
              className='gap-x-7 max-h-[490px] overflow-y-auto pr-1 no-scrollbar'
              style={{ columnCount: optimalCols }}
            >
              {displayGroups.map((group) => {
                const destinations = Array.isArray(group.destinations) ? group.destinations : [];
                return (
                  <div key={group.title} className='break-inside-avoid mb-6 inline-block w-full min-w-0'>
                    {/* Category Header with green square marker */}
                    <Link
                      href={`/destinations/${slugify(group.title)}`}
                      className='group/head flex items-center gap-2 mb-2.5 hover:opacity-85 transition-opacity'
                    >
                      <span className='w-2 h-2 rounded-[2px] bg-[#65a30d] shrink-0 group-hover/head:scale-125 transition-transform' />
                      <h4 className='font-heading text-xs font-bold uppercase tracking-wider text-[#0f2d4a] group-hover/head:text-primary transition-colors leading-tight'>
                        {group.title}
                      </h4>
                    </Link>

                    {/* Listings under category */}
                    <ul className='space-y-1.5 pl-3.5 border-l border-slate-100'>
                      {destinations.map((dest) => (
                        <li key={dest._id || dest.slug || dest.title}>
                          <Link
                            href={`/destination/${dest.slug || slugify(dest.title)}`}
                            className='block text-[13px] text-slate-600 hover:text-primary hover:translate-x-0.5 transition-all py-0.5 leading-snug'
                          >
                            {dest.title}
                          </Link>
                        </li>
                      ))}
                      {destinations.length === 0 && (
                        <li>
                          <Link
                            href={`/destinations/${slugify(group.title)}`}
                            className='block text-xs text-slate-400 hover:text-primary transition-colors italic py-0.5'
                          >
                            View all
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── BOTTOM ACCENT BAR ── */}
          <div className='flex flex-wrap items-center justify-between border-t border-slate-100 bg-slate-50/90 px-7 sm:px-8 py-3.5 gap-4'>
            <div className='flex items-center gap-3'>
              <div className='w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0'>
                <MapPin className='w-3.5 h-3.5' />
              </div>
              <p className='text-xs text-slate-600 font-medium'>
                <span className='font-semibold text-slate-900'>Explore the World:</span> Handpicked destinations spanning every continent and corner of the globe.
              </p>
            </div>

            <div className='flex items-center gap-3 ml-auto'>
              {featured && (
                <Link
                  href={`/destinations/${slugify(featured.title)}`}
                  className='hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary bg-white border border-slate-200 hover:border-primary/40 px-3 py-1.5 rounded-full transition-all shadow-2xs'
                >
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                  <span>Popular: <strong className='text-slate-900 font-bold'>{featured.title}</strong></span>
                </Link>
              )}
              <Link
                href='/destinations'
                className='inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-4 py-1.5 rounded-full transition-all shadow-sm'
              >
                <span>All Destinations</span>
                <ArrowRight className='w-3 h-3' />
              </Link>
            </div>
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
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-muted/20'>
      <button
        type='button'
        className='flex w-full items-center justify-between px-4 py-3 text-left'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className='flex min-w-0 flex-1 items-center gap-2 font-heading text-sm font-semibold text-foreground'>
          <Compass className='w-4 h-4 text-primary' />
          Tours
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className='border-t border-border/50 bg-background/60 px-3 pb-3 pt-2 space-y-1.5'>
          <Link
            href='/tours'
            onClick={onClose}
            className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors'
          >
            <ArrowRight className='w-3.5 h-3.5' />
            All Tours
          </Link>

          {(groups || []).map((group) => {
            const regions = Array.isArray(group.regions) ? group.regions : [];
            const isGroupOpen = openGroup === group.tag;
            return (
              <div key={group.tag} className='rounded-xl border border-border/40 bg-card/60 overflow-hidden'>
                <button
                  type='button'
                  className='flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70 transition-colors rounded-xl text-left'
                  onClick={() => setOpenGroup(isGroupOpen ? null : group.tag)}
                >
                  <span className='flex items-center gap-2 truncate'>
                    <span className='w-1.5 h-1.5 rounded-[2px] bg-[#65a30d] shrink-0' />
                    <span className='truncate'>{group.name || group.tag}</span>
                  </span>
                  {regions.length > 0 && (
                    <div className='flex items-center gap-1 ml-2 flex-shrink-0'>
                      <span className='text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full'>{regions.length}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </button>

                {isGroupOpen && (
                  <div className='px-3 pb-3 pt-1 border-t border-border/40 bg-muted/20 flex flex-wrap gap-1.5'>
                    <Link
                      href={`/tours/${group.tag}`}
                      onClick={onClose}
                      className='px-2.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all'
                    >
                      All in {group.name || group.tag}
                    </Link>
                    {regions.map((region) => (
                      <Link
                        key={region.tag}
                        href={`/tours/${group.tag}/${region.tag}`}
                        onClick={onClose}
                        className='px-2.5 py-1 rounded-full bg-background border border-border/60 text-xs font-medium text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all'
                      >
                        {region.name || region.tag}
                      </Link>
                    ))}
                    {regions.length === 0 && (
                      <span className='text-xs text-muted-foreground italic px-1 py-0.5'>
                        No specific sub-regions
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileDestinationMenu({ groups, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-muted/20'>
      <button
        type='button'
        className='flex w-full items-center justify-between px-4 py-3 text-left'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className='flex min-w-0 flex-1 items-center gap-2 font-heading text-sm font-semibold text-foreground'>
          <MapPin className='w-4 h-4 text-primary' />
          Destinations
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className='border-t border-border/50 bg-background/60 px-3 pb-3 pt-2 space-y-1.5'>
          <Link
            href='/destinations'
            onClick={onClose}
            className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors'
          >
            <ArrowRight className='w-3.5 h-3.5' />
            All Destinations
          </Link>

          {(groups || []).map((group) => {
            const destinations = Array.isArray(group.destinations) ? group.destinations : [];
            const isGroupOpen = openGroup === group.title;
            return (
              <div key={group.title} className='rounded-xl border border-border/40 bg-card/60 overflow-hidden'>
                <button
                  type='button'
                  className='flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70 transition-colors rounded-xl text-left'
                  onClick={() => setOpenGroup(isGroupOpen ? null : group.title)}
                >
                  <span className='flex items-center gap-2 truncate'>
                    <span className='w-1.5 h-1.5 rounded-[2px] bg-[#65a30d] shrink-0' />
                    <span className='truncate'>{group.title}</span>
                  </span>
                  {destinations.length > 0 && (
                    <div className='flex items-center gap-1 ml-2 flex-shrink-0'>
                      <span className='text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full'>{destinations.length}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </button>

                {isGroupOpen && (
                  <div className='px-3 pb-3 pt-1 border-t border-border/40 bg-muted/20 flex flex-wrap gap-1.5'>
                    <Link
                      href={`/destinations/${slugify(group.title)}`}
                      onClick={onClose}
                      className='px-2.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all'
                    >
                      All in {group.title}
                    </Link>
                    {destinations.map((dest) => (
                      <Link
                        key={dest._id || dest.slug || dest.title}
                        href={`/destination/${dest.slug || slugify(dest.title)}`}
                        onClick={onClose}
                        className='px-2.5 py-1 rounded-full bg-background border border-border/60 text-xs font-medium text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all'
                      >
                        {dest.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
            <Link href='/' className={desktopLinkClass(isActive('/'))}>
              Home
              <span className={underlineClass(isActive('/'))} />
            </Link>

            {/* Blog */}
            <Link href='/blogs' className={desktopLinkClass(isActive('/blogs'))}>
              Blog
              <span className={underlineClass(isActive('/blogs'))} />
            </Link>

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




