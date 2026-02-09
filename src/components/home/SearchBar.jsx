'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Compass, Clock, DollarSign, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

const durationOptions = ['1', '3', '5', '7', '14', '30', '60', '90', '120']; // SAME AS ToursClient FILTERS
const typeOptions = ['fixed_date', 'selectable_date', 'both'];
const typeLabels = {
  fixed_date: 'Fixed Dates',
  selectable_date: 'Flexible Dates',
  both: 'Fixed + Flexible',
};

const SearchBar = () => {
  const router = useRouter();

  const [place, setPlace] = useState('');
  const [tourType, setTourType] = useState('');
  const [duration, setDuration] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const handleSearch = () => {
    const query = new URLSearchParams();

    if (place.trim()) query.append('search', place.trim());
    if (tourType) query.append('category', tourType); // backend expects "category"
    if (duration) query.append('duration', duration);
    if (maxBudget) query.append('max', maxBudget);

    router.push(`/tours?${query.toString()}`);
  };

  return (
    <section className='relative -mt-24 z-20'>
      <div className='container mx-auto px-4'>
        <div className='bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            {/* PLACE INPUT */}
            <div className='space-y-2 w-full'>
              <label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <MapPin className='w-4 h-4 text-primary' />
                Destination
              </label>
              <Input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder='Enter place...'
                className='h-12 '
              />
            </div>

            {/* TOUR TYPE */}
            <div className='space-y-2 w-full'>
              <label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Compass className='w-4 h-4 text-primary' />
                Travel Style
              </label>
              <Select onValueChange={setTourType}>
                <SelectTrigger
                  style={{ height: '3rem !important' }}
                  className='w-full'>
                  <SelectValue
                    className='h-12 py-4 w-full'
                    placeholder='Select Type'
                  />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                      className='focus:bg-primary focus:text-primary-foreground'>
                      {typeLabels[t] || t.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DURATION (same as ToursClient filter) */}
            <div className='space-y-2 w-full'>
              <label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Clock className='w-4 h-4 text-primary' />
                Duration
              </label>
              <Select className='h-12' onValueChange={setDuration}>
                <SelectTrigger
                  style={{ height: '3rem !important' }}
                  className={'w-full'}>
                  <SelectValue placeholder='Min days' />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((d) => (
                    <SelectItem
                      key={d}
                      value={d}
                      className='focus:bg-primary focus:text-primary-foreground'>
                      {d}+ Days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* BUDGET INPUTS */}
            <div className='space-y-2  w-full'>
              <label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <DollarSign className='w-4 h-4 text-primary' />
                Budget (₹)
              </label>

              <div className='flex h-12 gap-2'>
                <Input
                  type='number'
                  placeholder='Total Budget'
                  className='h-12'
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>
            </div>

            {/* SEARCH BUTTON */}
            <div className='flex items-end'>
              <Button
                className='h-12 py-4 w-full  text-base'
                onClick={handleSearch}>
                <Search className='mr-2 w-5 h-5' />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
