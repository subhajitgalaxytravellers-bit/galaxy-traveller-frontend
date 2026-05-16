'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'react-toastify';
import { MessageCircle } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', label: '+91 (India)' },
  { code: '+1', label: '+1 (USA/Canada)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+61', label: '+61 (Australia)' },
  { code: '+86', label: '+86 (China)' },
  { code: '+81', label: '+81 (Japan)' },
  { code: '+49', label: '+49 (Germany)' },
  { code: '+33', label: '+33 (France)' },
];

export default function EnquiryCard({ tourId, creatorId, tourName }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return toast.error('Valid email is required');
    if (!form.phone.trim() || form.phone.length < 6)
      return toast.error('Valid phone number is required');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: `${form.countryCode}${form.phone.trim()}`,
      message: form.message.trim(),
      tour: tourId,
      tourCreatedBy: creatorId,
    };

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/enquiries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Submission failed');

      setSubmitted(true);
      toast.success('Enquiry sent! We will get back to you shortly.');
    } catch (err) {
      toast.error(err.message || 'Failed to send enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className='shadow-none border-0 bg-green-50'>
        <CardContent className='pt-6 text-center space-y-3'>
          <div className='text-4xl'>✓</div>
          <p className='text-green-700 font-semibold text-lg'>Enquiry Sent!</p>
          <p className='text-sm text-green-600'>
            Our team will reach out to you soon about{' '}
            <span className='font-medium'>{tourName}</span>.
          </p>
          <Button
            variant='outline'
            size='sm'
            className='mt-2'
            onClick={() => {
              setSubmitted(false);
              setForm({ name: '', email: '', phone: '', countryCode: '+91', message: '' });
            }}>
            Send Another Enquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='shadow-none border-0'>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-2'>
          <MessageCircle className='h-5 w-5 text-primary' />
          <CardTitle className='font-heading text-lg font-semibold tracking-tight'>
            Enquire About This Tour
          </CardTitle>
        </div>
        <CardDescription className='text-sm'>
          Fill in your details and we&apos;ll get back to you with more information.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Name */}
          <div className='space-y-1.5'>
            <Label htmlFor='enq-name'>Name *</Label>
            <Input
              id='enq-name'
              name='name'
              placeholder='Your full name'
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className='space-y-1.5'>
            <Label htmlFor='enq-email'>Email *</Label>
            <Input
              id='enq-email'
              type='email'
              name='email'
              placeholder='you@example.com'
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <div className='space-y-1.5'>
            <Label>Phone *</Label>
            <div className='flex gap-2'>
              <div className='w-[140px] shrink-0'>
                <Select
                  value={form.countryCode}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, countryCode: val }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Code' />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type='tel'
                name='phone'
                placeholder='Phone number'
                className='flex-1'
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Message */}
          <div className='space-y-1.5'>
            <Label htmlFor='enq-message'>Message (optional)</Label>
            <textarea
              id='enq-message'
              name='message'
              placeholder='Tell us about your travel plans, group size, preferred dates, or any questions...'
              value={form.message}
              onChange={handleChange}
              rows={4}
              maxLength={2000}
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none'
            />
            <p className='text-xs text-muted-foreground text-right'>
              {form.message.length}/2000
            </p>
          </div>

          <Button
            type='submit'
            className='w-full'
            disabled={loading}>
            {loading ? 'Sending...' : 'Send Enquiry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
