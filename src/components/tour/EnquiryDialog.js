'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Input } from '../ui/input';
import client from '@/api/client';
import { toast } from 'react-toastify';
import { Label } from '../ui/label';

export default function EnquiryDialog({
  open,
  setOpen,
  guests,
  dateRange,
  basePrice,
  onSubmit,
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
  });

  const countryCodes = [
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
  ];

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // compute derived values
  const totalGuests = (guests?.adults || 0) + (guests?.children || 0);
  const totalPrice = totalGuests * basePrice;
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const mergedPhone = `${form.countryCode}${form.phone.trim()}`;
    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: mergedPhone,
      countryCode: undefined, // remove countryCode from payload as it's merged into phone
      adults: guests?.adults || 0,
      children: guests?.children || 0,
      totalPeople: totalGuests,
      totalPrice,
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate,
    };

    onSubmit(payload);
    setForm({ name: '', email: '', phone: '' });
    setOtpLoading(false);
    setOtpVerified(false);
    setOtpSent(false);
    setOtp('');
    setOpen(false);
  };

  const sendOtp = async () => {
    if (!form.phone || form.phone.length < 10) {
      toast.error('Enter valid phone number');
      return;
    }

    try {
      setOtpLoading(true);
      const fullPhone = `${form.countryCode}${form.phone.trim()}`;
      await client.post('/otp/send', { phone: fullPhone });
      setOtpSent(true);
      toast.success('OTP sent');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setOtpLoading(true);
      const fullPhone = `${form.countryCode}${form.phone.trim()}`;
      await client.post('/otp/verify', {
        phone: fullPhone,
        otp,
      });
      setOtpVerified(true);
      setOtpSent(false);
      setOtp('');
      toast.success('Phone verified');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} close>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold text-primary'>
            Send Enquiry
          </DialogTitle>
        </DialogHeader>

        <div className=' flex flex-col gap-4'>
          {/* Name */}
          <div className='space-y-2'>
            <label
              htmlFor='name'
              className='text-sm sm:text-base text-muted-foreground'>
              Name
            </label>
            <Input
              type='text'
              name='name'
              placeholder='Your Name'
              value={form.name}
              onChange={handleChange}
              required
              className='text-sm sm:text-base'
            />
          </div>

          {/* Email */}
          <div className='space-y-2'>
            <label
              htmlFor='email'
              className='text-sm sm:text-base text-muted-foreground'>
              Email
            </label>
            <Input
              type='email'
              name='email'
              placeholder='you@example.com'
              value={form.email}
              onChange={handleChange}
              required
              className='text-sm sm:text-base'
            />
          </div>

          {/* Phone */}
          <div className='space-y-2'>
            <label className='text-sm sm:text-base text-muted-foreground'>
              Phone
            </label>

            <div className='flex gap-2'>
              <div className='w-[140px]'>
                 <Select
                  value={form.countryCode}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, countryCode: val }))
                  }
                  disabled={otpVerified}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Code' />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} ({c.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type='tel'
                name='phone'
                placeholder='Phone Number'
                className='text-sm sm:text-base flex-1'
                value={form.phone}
                disabled={otpVerified}
                required
                onChange={(e) => {
                  handleChange(e);
                  setOtpVerified(false);
                  setOtpSent(false);
                  setOtp('');
                }}
              />

              {!otpSent && !otpVerified && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={sendOtp}
                  disabled={otpLoading}>
                  Verify
                </Button>
              )}
            </div>

            {otpSent && !otpVerified && (
              <div className='flex gap-2 mt-2'>
                <Input
                  placeholder='Enter OTP'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <Button
                  type='button'
                  onClick={verifyOtp}
                  disabled={otpLoading || otp.length < 4}>
                  Confirm
                </Button>

                <Button
                  type='button'
                  variant='ghost'
                  onClick={sendOtp}
                  disabled={otpLoading}>
                  Resend
                </Button>
              </div>
            )}

            {otpVerified && (
              <p className='text-sm text-green-600 mt-1'>
                ✓ Phone number verified
              </p>
            )}
          </div>

          {/* Read-only trip info */}
          <div className='pt-4 pb-2 border-t border-border flex flex-col gap-2 text-sm sm:text-base'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Travel Dates:</span>
              <span className='font-medium text-foreground'>
                {dateRange?.startDate
                  ? `${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(
                      dateRange.endDate,
                      'MMM d, yyyy',
                    )}`
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Adults:</span>
              <span>{guests?.adults || 0}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Children:</span>
              <span>{guests?.children || 0}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Total Guests:</span>
              <span className='font-medium text-foreground'>
                {totalGuests || 0}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Total Price:</span>
              <span className='font-medium text-foreground'>
                ₹{totalPrice || 0}
              </span>
            </div>
          </div>

          {/* Submit */}
          <Button
            type='button'
            className='w-full h-11 sm:h-12 bg-primary  hover:bg-primary  text-white font-medium text-sm sm:text-base transition-colors'
            onClick={handleSubmit}
            disabled={!otpVerified}>
            Submit Enquiry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
