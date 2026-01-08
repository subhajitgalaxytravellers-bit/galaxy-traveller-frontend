'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ArrowDown, Mail, MapPin, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import client from '@/api/client';
import { useCreateLead } from '@/lib/contact';
import Image from 'next/image';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  contact: z.string().trim().min(10).max(15),
  countryCode: z.string().min(1),
  month: z.string().min(1),
  year: z.string().min(1),
  duration: z.string().min(1),
  people: z.string().min(1),
  budget: z.string().min(1),
  destination: z.string().trim().min(2).max(200),
  comment: z.string().trim().max(1000).optional(),
});

export default function ContactClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createLead = useCreateLead();

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      contact: '',
      countryCode: '+91',
      month: '',
      year: '',
      duration: '',
      people: '',
      budget: '',
      destination: '',
      comment: '',
    },
  });

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2].map(String);

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

  const [contact, setContact] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await client.get('/settings');
        setContact(res?.data?.data?.footerContact || {});
      } catch (e) {
        console.error('Failed loading settings', e);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        contact: `${data.countryCode}${data.contact.trim()}`, // Merge code + number
        countryCode: undefined, // Remove if backend doesn't need separate field, or keep if logging
        people: Number(data.people),
        budget: Number(data.budget),
        year: Number(data.year),
        source: 'contact-page',
      };

      await createLead.mutateAsync(payload);

      toast.success('Lead submitted successfully!');
      form.reset();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const sendOtp = async () => {
    const phoneNum = form.getValues('contact');
    const code = form.getValues('countryCode');
    
    if (!phoneNum || phoneNum.length < 5) {
      toast.error('Enter valid phone number');
      return;
    }

    const fullPhone = `${code}${phoneNum}`;

    try {
      setOtpLoading(true);
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
    const phoneNum = form.getValues('contact');
    const code = form.getValues('countryCode');
    const fullPhone = `${code}${phoneNum}`;

    try {
      setOtpLoading(true);
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

  console.log('Contact info:', contact);
  return (
    <div className='min-h-screen'>
      {/* HERO */}
      <section className='relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden'>
        <div className='relative z-15 text-center px-4'>
          <h1 className='text-5xl font-bold text-white mb-4'>Get in Touch</h1>
          <p className='text-xl text-gray-300 max-w-2xl mx-auto'>
            Ready to embark on your next adventure? Tell us your plans and
            we&apos;ll tailor your trip.
          </p>
        </div>

        <div className='absolute inset-0 hero-bottom-fade z-10' />

        <Image
          src={'/assets/hero-blog.jpg'}
          alt='Contact'
          fill
          className='object-cover'
          priority
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className='absolute bottom-12'>
          <div className='flex flex-col items-center gap-2 text-white'>
            <span className='text-sm font-medium'>Scroll</span>
            <ArrowDown className='w-6 h-6 animate-bounce' />
          </div>
        </motion.div>
      </section>

      {/* FORM + INFO */}
      <div className='pt-16 pb-20 px-6 lg:px-32'>
        <div className='container mx-auto grid lg:grid-cols-3 gap-12'>
          {/* INFO */}
          <div className='space-y-8'>
            <div>
              <h2 className='text-2xl font-bold mb-6'>Contact Information</h2>

              <div className='space-y-6'>
                {/* PHONE */}
                <div className='flex gap-4'>
                  <div className='bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center'>
                    <Phone className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-semibold mb-1'>Phone</h3>
                    <p className='text-muted-foreground'>{contact?.contact1}</p>
                    <p className='text-muted-foreground'>{contact?.contact2}</p>
                  </div>
                </div>

                {/* EMAIL */}
                <div className='flex gap-4'>
                  <div className='bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center'>
                    <Mail className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-semibold mb-1'>Email</h3>
                    <p className='text-muted-foreground'>{contact?.email}</p>
                  </div>
                </div>

                {/* ADDRESS */}
                <div className='flex gap-4'>
                  <div className='bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center'>
                    <MapPin className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-semibold mb-1'>Address</h3>
                    <p className='text-muted-foreground'>
                      {contact?.location ||
                        'Our global offices are here to help'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className='lg:col-span-2'>
            <div className='bg-card border rounded-2xl shadow-sm p-6 sm:p-8'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <p className='text-sm text-primary font-semibold uppercase tracking-wide'>
                    Plan your trip
                  </p>
                  <h2 className='text-2xl font-bold text-foreground'>
                    Tell us about your journey
                  </h2>
                </div>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-5'>
                  <div className='grid sm:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder='John Doe' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='email'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              className={'w-full'}
                              placeholder='you@example.com'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid sm:grid-cols-3 gap-4'>
                    <FormField
                      control={form.control}
                      name='countryCode'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country Code</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            disabled={otpVerified}
                            defaultValue={field.countryCode}>
                            <FormControl>
                              <SelectTrigger className={'w-full'}>
                                <SelectValue  placeholder='Country code' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countryCodes.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.code} ({c.country})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='contact'
                      render={({ field }) => (
                        <FormItem className='sm:col-span-2'>
                          <FormLabel>Phone</FormLabel>

                          {/* PHONE + VERIFY */}
                          <div className='flex gap-2'>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder='00000 00000'
                                disabled={otpVerified}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setOtpVerified(false);
                                  setOtpSent(false);
                                  setOtp('');
                                }}
                              />
                            </FormControl>

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

                          {/* OTP INPUT */}
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

                          {/* VERIFIED STATE */}
                          {otpVerified && (
                            <p className='text-sm text-green-600 mt-1'>
                              ✓ Phone number verified
                            </p>
                          )}

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid sm:grid-cols-3 gap-4'>
                    <FormField
                      control={form.control}
                      name='month'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className={'w-full'}>
                                <SelectValue placeholder='Select month' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='year'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className={'w-full'}>
                                <SelectValue placeholder='Select year' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((y) => (
                                <SelectItem key={y} value={y}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='duration'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (days)</FormLabel>
                          <FormControl>
                            <Input
                              className='w-full'
                              type='number'
                              placeholder='7'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid sm:grid-cols-3 gap-4'>
                    <FormField
                      control={form.control}
                      name='people'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>People</FormLabel>
                          <FormControl>
                            <Input
                              className={'w-full'}
                              placeholder='2'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='budget'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <Input
                              className={'w-full'}
                              placeholder='Ex: Rs 100000'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='destination'
                      render={({ field }) => (
                        <FormItem className='sm:col-span-1'>
                          <FormLabel>Destination</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Where do you want to go?'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='comment'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder='Share your ideas, preferences, or special requests'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type='submit'
                    className='w-full'
                    disabled={isSubmitting || !otpVerified}>
                    {isSubmitting ? 'Submitting...' : 'Send Enquiry'}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
