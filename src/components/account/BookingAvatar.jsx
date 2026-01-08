'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import AuthDialog from '@/components/Auth/authDialog';
import { UserRound } from 'lucide-react';

const getInitials = (name = '') => {
  const parts = String(name).trim().split(' ');
  if (!parts.length) return 'GT';
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  return (first + second || first).toUpperCase();
};

export default function BookingAvatar({ isScrolled }) {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const initials = useMemo(
    () => getInitials(user?.name || user?.email),
    [user],
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label='Open account'
            className={
              'bg-transparent px-2 py-1 hover:border-primary transition-colors'
            }>
            <Avatar className='h-8 w-8 md:h-9 md:w-9'>
              {isLoggedIn && user?.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name || 'User'} />
              ) : null}
              <AvatarFallback
                className={
                  isScrolled
                    ? 'bg-primary text-white text-sm font-semibold'
                    : 'bg-white text-primary  text-sm font-semibold'
                }>
                {isLoggedIn && initials ? (
                  initials
                ) : (
                  <UserRound
                    className={
                      isScrolled ? 'h-4 w-4 text-white' : 'h-4 w-4 text-primary'
                    }
                  />
                )}
              </AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>
        <PopoverContent align='end' className='w-64 p-4 shadow-lg'>
          {isLoggedIn && user ? (
            <div className='space-y-3'>
              <div>
                <p className='text-sm font-semibold text-foreground'>
                  {user.name || 'Traveller'}
                </p>
                <p className='text-xs text-muted-foreground'>{user.email}</p>
              </div>
              <Link
                href='/bookings'
                className='block w-full'
                onClick={() => setOpen(false)}>
                <Button className='w-full' size='sm'>
                  My bookings
                </Button>
              </Link>
              <Button
                variant='destructive'
                className='w-full transition-colors hover:brightness-110'
                size='sm'
                onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className='space-y-3 text-sm'>
              <p className='text-muted-foreground'>
                Sign in to view and manage your bookings.
              </p>
              <Button
                className='w-full'
                size='sm'
                onClick={() => setAuthOpen(true)}>
                Login
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthSuccess={(data) => {
          setUser(data?.user || null);
          setIsLoggedIn(!!data?.token);
          setAuthOpen(false);
        }}
      />
    </>
  );
}
