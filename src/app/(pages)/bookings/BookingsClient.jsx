'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import PaymentDialog from '@/components/tour/PaymentDialog';
import { createPayment } from '@/lib/razorpay';
import BookingProcessingOverlay from '@/components/common/ProcessDialog';
import AuthDialog from '@/components/Auth/authDialog';
import { toast } from 'react-toastify';
import Image from 'next/image';

const API_BASE = (process.env.NEXT_PUBLIC_BASE_API || '').replace(/\/$/, '');
const countWords = (text = '') =>
  text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSaving, setCancelSaving] = useState(false);
  const router = useRouter();
  const cancelWordCount = countWords(cancelReason);
  const cancelOverLimit = cancelWordCount > 500;

  // load Razorpay
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const formatRs = (value = 0) =>
    `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthOpen(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/booking/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBookings(data?.data?.items || data?.items || []);
    } catch (e) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePayClick = (booking) => {
    setActiveBooking(booking);
    setPaymentOpen(true);
  };

  const handleConfirmPayment = async ({ selectedPayment }) => {
    if (!activeBooking) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthOpen(true);
      return;
    }
    try {
      setProcessing(true);
      const order = await createPayment({
        gateway: 'razorpay',
        bookingId: activeBooking._id || activeBooking.id,
        paymentMode: selectedPayment,
      });

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: activeBooking.tourName || activeBooking.tour?.title,
        description: 'Tour Booking',
        prefill: {
          name: activeBooking.contactInfo?.name,
          email: activeBooking.contactInfo?.email,
          contact: activeBooking.contactInfo?.phone,
        },
        handler: async function (response) {
          await fetch(`${API_BASE}/api/payment/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              bookingId: activeBooking._id || activeBooking.id,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              paymentMode: selectedPayment,
            }),
          });
          toast.success('Payment successful');
          setPaymentOpen(false);
          fetchBookings();
        },
        modal: {
          ondismiss: () => toast.error('Payment cancelled'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error('Payment failed to start');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelClick = (booking) => {
    if (!booking || booking.status === 'cancelled') {
      toast.info('This booking is already cancelled.');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tripStart = booking.startDate ? new Date(booking.startDate) : null;
    if (tripStart && tripStart < today) {
      toast.info('Trip has already started. Cancellation is disabled.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthOpen(true);
      return;
    }
    setCancelTarget(booking);
    setCancelReason(booking?.cancellationReason || '');
    setCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast.error('Please add a cancellation reason (max 500 words).');
      return;
    }
    if (countWords(reason) > 500) {
      toast.error('Cancellation reason must be 500 words or fewer.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthOpen(true);
      return;
    }
    try {
      setCancelSaving(true);
      const res = await fetch(
        `${API_BASE}/api/booking/${cancelTarget._id || cancelTarget.id}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Failed to cancel booking');
      }
      toast.success('Booking cancelled');
      setCancelOpen(false);
      setCancelTarget(null);
      setCancelReason('');
      fetchBookings();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Failed to cancel booking');
    } finally {
      setCancelSaving(false);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* HERO */}
      <section className='relative h-[60vh] min-h-[400px] flex items-center justify-center text-center'>
        <Image
          src='/assets/hero-blog.jpg'
          alt='Bookings'
          fill
          className='object-cover'
          priority
        />
        <div className='absolute inset-0 hero-bottom-fade' />
        <div className='relative z-10 container mx-auto px-4 flex flex-col items-center justify-center'>
          <h1 className='text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow'>
            My Bookings
          </h1>
          <p className='text-lg md:text-xl text-white/80 max-w-2xl'>
            Track your trips, payments, and invoices in one place.
          </p>
        </div>
      </section>

      <div className='container mx-auto px-4 space-y-6 py-10'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground'>
              All trips
            </h2>
            <p className='text-muted-foreground'>
              Manage your trips and payments
            </p>
          </div>
          <Button
            variant='outline'
            className='hover:bg-primary/90 hover:text-primary-foreground'
            onClick={() => router.push('/tours')}>
            Book another tour
          </Button>
        </div>

        {loading ? (
          <div className='bg-white/60 dark:bg-card border border-border rounded-xl p-8 text-center shadow-sm'>
            <p className='text-muted-foreground'>Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className='bg-white/60 dark:bg-card border border-border rounded-xl p-8 text-center shadow-sm'>
            <p className='text-muted-foreground mb-3'>No bookings yet.</p>
            <Link href='/tours'>
              <Button>Explore tours</Button>
            </Link>
          </div>
        ) : (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {bookings.map((booking) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tripStart = booking.startDate
                ? new Date(booking.startDate)
                : null;
              const tripStarted = tripStart ? tripStart < today : false;
              const remaining = Number(booking.payment?.remainingAmount ?? 0);
              const amountPaid = Number(booking.payment?.amountPaid ?? 0);
              const paymentStatus = booking.payment?.paymentStatus;
              const guestAdults = Number(booking.guests?.adults ?? 0);
              const guestChildren = Number(booking.guests?.children ?? 0);
              const totalGuests =
                Number(booking.totalPersons) ||
                guestAdults + guestChildren ||
                0;
              const hasPartialOption =
                !!booking.payment?.partialAmount && amountPaid === 0;
              const isPartialPaid =
                paymentStatus === 'partial' && amountPaid > 0 && remaining > 0;
              const canPay =
                remaining > 0 &&
                !tripStarted &&
                booking.status !== 'cancelled' &&
                paymentStatus !== 'paid';
              const canCancel = booking.status !== 'cancelled' && !tripStarted;
              const tourSlug = booking.tour?.slug || booking.tourSlug;
              const tourPlace =
                booking.tour?.place ||
                booking.tourPlace ||
                booking.tourLocation ||
                '';
              const tourTitle =
                booking.tourName || booking.tour?.title || 'Tour';
              const tourHref = tourSlug ? `/tours/${tourSlug}` : null;

              const payAmount = isPartialPaid
                ? remaining
                : Number(booking.payment?.totalAmount || remaining);
              const fullLabel = isPartialPaid
                ? 'Pay Remaining'
                : 'Full Payment';

              return (
                <Card
                  key={booking._id || booking.id || booking.invoiceId}
                  className='group overflow-hidden border py-0 border-border/50 bg-card/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-primary/60'>
                  <div className='relative h-40 w-full overflow-hidden'>
                    <div className='absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent z-10' />
                    {booking.tour?.heroImg ? (
                      <Image
                        src={booking.tour.heroImg}
                        alt={tourTitle}
                        fill
                        className='object-cover transition-transform duration-500 group-hover:scale-105'
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className='h-full w-full bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20' />
                    )}
                    <div className='absolute top-3 left-3 flex flex-col gap-2 z-20'>
                      <Badge className='bg-black/70 text-white border-white/10 shadow-sm'>
                        {tourPlace || 'Explore'}
                      </Badge>
                    </div>
                    <div className='absolute top-3 right-3 z-20'>
                      <Badge className='capitalize bg-white/90 text-foreground shadow-sm border-border'>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className='space-y-2 relative'>
                    <div className='flex items-start justify-between gap-3'>
                      <CardTitle className='text-xl'>
                        {tourHref ? (
                          <Link
                            href={tourHref}
                            className='hover:text-primary transition-colors'>
                            {tourTitle}
                          </Link>
                        ) : (
                          tourTitle
                        )}
                      </CardTitle>
                      {booking.invoiceId && (
                        <span className='text-[11px] px-2 py-1 rounded-full bg-muted uppercase text-muted-foreground border border-border'>
                          {booking.invoiceId}
                        </span>
                      )}
                    </div>
                    {tourPlace && !booking.tour?.heroImg && (
                      <p className='text-xs text-muted-foreground'>
                        {tourPlace}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className='space-y-4 pb-4 text-sm text-muted-foreground'>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='rounded-lg border border-border/70 bg-muted/30 px-3 py-2'>
                        <p className='text-xs text-muted-foreground'>Dates</p>
                        <p className='text-foreground font-medium'>
                          {booking.startDate &&
                            format(new Date(booking.startDate), 'MMM d')}{' '}
                          -{' '}
                          {booking.endDate &&
                            format(new Date(booking.endDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className='rounded-lg border border-border/70 bg-muted/30 px-3 py-2'>
                        <p className='text-xs text-muted-foreground'>Guests</p>
                        <p className='text-foreground font-medium'>
                          {totalGuests}
                        </p>
                      </div>
                      <div className='rounded-lg border border-border/70 bg-muted/30 px-3 py-2'>
                        <p className='text-xs text-muted-foreground'>Paid</p>
                        <p className='text-foreground font-medium'>
                          {formatRs(amountPaid)}
                        </p>
                      </div>
                    <div className='rounded-lg border border-border/70 bg-muted/30 px-3 py-2'>
                      <p className='text-xs text-muted-foreground'>
                        Remaining
                      </p>
                      <p className='text-foreground font-medium'>
                        {formatRs(remaining)}
                      </p>
                    </div>
                  </div>

                    <div className='flex flex-col gap-2'>
                      {canPay && (
                        <Button
                          className='w-full h-11 rounded-full shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-primary/30'
                          onClick={() => handlePayClick(booking)}>
                          {isPartialPaid ? 'Pay remaining amount' : 'Pay now'}
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          variant='outline'
                          className='w-full h-11 rounded-full border-dashed'
                          onClick={() => handleCancelClick(booking)}>
                          Cancel booking
                        </Button>
                      )}
                    </div>

                    {booking.status === 'cancelled' &&
                      booking.cancellationReason && (
                        <div className='rounded-lg border border-border/70 bg-muted/20 px-3 py-2'>
                          <p className='text-[11px] uppercase text-muted-foreground tracking-wide mb-1'>
                            Cancellation reason
                          </p>
                          <p className='text-sm text-foreground whitespace-pre-wrap leading-relaxed'>
                            {booking.cancellationReason}
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {activeBooking && (() => {
          const modalAdults = Number(activeBooking.guests?.adults ?? 0);
          const modalChildren = Number(activeBooking.guests?.children ?? 0);
          const modalTotal =
            Number(activeBooking.totalPersons || 0) ||
            modalAdults + modalChildren ||
            1;
          return (
        <PaymentDialog
          showBookingModal={paymentOpen}
          setShowBookingModal={setPaymentOpen}
          tourName={
            activeBooking.tourName || activeBooking.tour?.title || 'Tour'
          }
          tourLocation={
            activeBooking.tour?.place ||
            activeBooking.tourLocation ||
            activeBooking.tourPlace ||
            ''
          }
          dateRange={{
            startDate: activeBooking.startDate
              ? new Date(activeBooking.startDate)
              : null,
            endDate: activeBooking.endDate
              ? new Date(activeBooking.endDate)
              : null,
          }}
          paymentMode={
            activeBooking.payment?.paymentStatus === 'partial' &&
            Number(activeBooking.payment?.amountPaid || 0) > 0
              ? 'full'
              : activeBooking.payment?.paymentMode || 'full'
          }
          fullLabel={
            activeBooking.payment?.paymentStatus === 'partial' &&
            Number(activeBooking.payment?.amountPaid || 0) > 0
              ? 'Pay Remaining'
              : 'Full Payment'
          }
          guests={{
            adults: modalAdults || modalTotal,
            children: modalChildren,
          }}
          amount={
            activeBooking.payment?.paymentStatus === 'partial' &&
            Number(activeBooking.payment?.amountPaid || 0) > 0
              ? Number(activeBooking.payment?.remainingAmount || 0)
              : Number(activeBooking.payment?.totalAmount || 0)
          }
          paymentConfig={{
            full: { enabled: true },
            partial: {
              enabled:
                !!activeBooking.payment?.partialAmount &&
                Number(activeBooking.payment?.amountPaid || 0) === 0,
              price: Number(activeBooking.payment?.partialAmount || 0),
              totalAmount: Number(activeBooking.payment?.partialAmount || 0),
            },
          }}
          onConfirmPayment={handleConfirmPayment}
        />
          );
        })()}

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) {
            setCancelTarget(null);
            setCancelSaving(false);
            setCancelReason('');
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking</DialogTitle>
            <DialogDescription>
              Share the reason (up to 500 words). We will email this along with
              the cancellation confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder='Tell us why you need to cancel this trip'
              rows={5}
            />
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>Required</span>
              <span
                className={cancelOverLimit ? 'text-destructive' : undefined}>
                {cancelWordCount}/500 words
              </span>
            </div>
            {cancelTarget?.tourName && (
              <p className='text-sm text-muted-foreground'>
                Booking: <strong>{cancelTarget.tourName}</strong>
              </p>
            )}
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setCancelOpen(false)}>
              Close
            </Button>
            <Button
              variant='destructive'
              disabled={
                cancelOverLimit || !cancelReason.trim() || cancelSaving
              }
              onClick={handleConfirmCancel}>
              {cancelSaving ? 'Cancelling...' : 'Confirm cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BookingProcessingOverlay
        open={processing}
        text='Processing your payment...'
      />
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthSuccess={() => {
          setAuthOpen(false);
          setLoading(true);
          fetchBookings();
        }}
      />
    </div>
  );
}
