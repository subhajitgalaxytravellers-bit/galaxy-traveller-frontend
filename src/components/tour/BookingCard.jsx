'use client';
import { useEffect, useState } from 'react';
import { CalendarIcon, Users, Plus, Minus, BadgePercent } from 'lucide-react';
import { format, addDays } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';
import PaymentDialog from './PaymentDialog';
import BookingProcessingOverlay from '../common/ProcessDialog';
import client from '@/api/client';
import AuthDialog from '../Auth/authDialog';
import { getPaymentGateways, createPayment } from '../../lib/razorpay';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import EnquiryDialog from './EnquiryDialog';
import {
  clearAuth,
  getValidToken,
  isAuthErrorResponse,
  isAuthenticated,
  subscribeAuthChanges,
} from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export default function BookingCard({
  tourName,
  basePrice,
  tourDuration = 3,
  tourType = 'fixed_date',
  tourId,
  getDateRange,
  creatorId,
  tourLocation,
  paymentConfig = {
    full: { enabled: true },
    partial: { enabled: false, price: 0 },
  },
}) {
  const roundMoney = (value) =>
    Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  const clampPercent = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };
  // console.log("tourType", tourType, tourId);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const [gateways, setGateways] = useState([]);

  const [dateRange, setDateRange] = useState(getDateRange);
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [selectedTab, setSelectedTab] = useState(
    tourType == 'both' ? 'fixed_date' : tourType,
  );
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const showBookingBtn =
    dateRange?.startDate instanceof Date &&
    dateRange.startDate.getTime() > Date.now();

  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const isValidDate = (date) => date instanceof Date && !isNaN(date);

  useEffect(() => {
    if (tourType === 'fixed_date' && getDateRange) {
      const { startDate, endDate } = getDateRange;
      const validStartDate = isValidDate(startDate) ? startDate : null;
      const validEndDate = isValidDate(endDate) ? endDate : null;
      setDateRange({ startDate: validStartDate, endDate: validEndDate });
    }
  }, [tourType, getDateRange]);

  const handleSelect = (day) => {
    if (!day) return;
    const raw = tourDuration;
    const duration =
      typeof raw === 'number'
        ? raw
        : parseInt(String(raw).replace(/\D/g, ''), 10);

    const end = addDays(day, duration - 1);

    setDateRange({ startDate: day, endDate: end });
  };

  const increment = (type) => setGuests((g) => ({ ...g, [type]: g[type] + 1 }));
  const decrement = (type) =>
    setGuests((g) => ({ ...g, [type]: Math.max(0, g[type] - 1) }));

  const [paymentMode, setPaymentMode] = useState('full');
  const [bookingProcessing, setBookingProcessing] = useState(false);
  const [settingsGstRate, setSettingsGstRate] = useState(0);

  const totalGuests = guests.adults + guests.children;
  const partialEnabled = paymentConfig?.partial?.enabled;
  const partialPrice = Number(paymentConfig?.partial?.price || 0);

  const gstRate = clampPercent(settingsGstRate);
  const subtotalAmount = roundMoney(Number(basePrice || 0) * totalGuests);

  useEffect(() => {
    let active = true;
    const fetchSettingsGst = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/settings`);
        const data = await res.json();
        if (!active) return;
        const rate = Number(data?.data?.invoice?.gstRate || 0);
        setSettingsGstRate(Number.isFinite(rate) ? rate : 0);
      } catch (err) {
        console.error('Failed to load GST settings', err);
        if (active) setSettingsGstRate(0);
      }
    };
    fetchSettingsGst();
    return () => {
      active = false;
    };
  }, []);

  const [showAuth, setShowAuth] = useState(false);
  const [pendingBookingPayload, setPendingBookingPayload] = useState(null);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponState, setCouponState] = useState({
    applied: null, // { code, discount }
    loading: false,
    message: '',
  });
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(isAuthenticated());
    syncAuth();
    const unsubscribe = subscribeAuthChanges(syncAuth);
    return unsubscribe;
  }, []);

  const computeDiscount = (coupon, amount) => {
    if (!coupon) return 0;
    const value = Number(coupon.value || 0);
    let discount =
      coupon.type === 'percent' ? (Number(amount || 0) * value) / 100 : value;
    if (coupon.maxOff && coupon.maxOff > 0) {
      discount = Math.min(discount, coupon.maxOff);
    }
    return Math.max(0, Math.round(discount));
  };

  const applyCoupon = (payload, message = 'Coupon applied') => {
    if (!payload) {
      setCouponState({
        applied: null,
        loading: false,
        message: 'No coupon applied',
      });
      setCouponCode('');
      return;
    }
    setCouponState({
      applied: { code: payload.code, discount: Number(payload.discount || 0) },
      loading: false,
      message,
    });
    setCouponCode(payload.code || '');
  };
  const handleTabChange = (type) => {
    setSelectedTab(type);
    if (type === 'fixed_date') {
      setDateRange(getDateRange);
    }
  };

  const effectiveType = tourType === 'both' ? selectedTab : tourType;

  // Include currently applied coupon even if it's hidden (so dropdown shows it)
  const displayCoupons = (() => {
    const list = [...availableCoupons];
    const applied = couponState.applied;
    if (applied?.code && !list.find((c) => c.code === applied.code)) {
      list.push({
        code: applied.code,
        discount: applied.discount,
        message: applied.message,
        type: applied.type,
        value: applied.value,
        maxOff: applied.maxOff,
        hidden: true,
      });
    }
    return list;
  })();

  useEffect(() => {
    let active = true;
    const fetchCoupons = async () => {
      setCouponsLoading(true);
        try {
          const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/coupons/available?tourId=${tourId}&amount=${subtotalAmount}`,
        );
        const data = await res.json();
        if (!active) return;
        if (data?.success) {
          const items = (data.data?.items || []).filter((c) => !c.hidden);
          setAvailableCoupons(items);
          if (couponState.applied?.code) {
            const refreshed = items.find(
              (c) => c.code === couponState.applied.code,
            );
            if (refreshed) {
              const discount =
                refreshed.discount ?? computeDiscount(refreshed, subtotalAmount);
              applyCoupon(
                { code: refreshed.code, discount },
                refreshed.message || 'Coupon applied',
              );
            } else {
              setCouponState({
                applied: null,
                loading: false,
                message: 'Coupon no longer valid for this booking',
              });
            }
          }
        } else {
          setAvailableCoupons([]);
        }
      } catch (err) {
        console.error('Failed to load coupons', err);
        if (active) setAvailableCoupons([]);
      } finally {
        if (active) setCouponsLoading(false);
      }
    };
    fetchCoupons();
    return () => {
      active = false;
    };
  }, [tourId, subtotalAmount]);

  const handleCouponSelectFromDropdown = (coupon) => {
    if (!coupon) {
      applyCoupon(null, 'No coupon applied');
      return;
    }
    const discount = coupon.discount ?? computeDiscount(coupon, subtotalAmount);
    applyCoupon(
      { code: coupon.code, discount },
      coupon.message || 'Coupon applied',
    );
  };

  const handleApplyCouponCode = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error('Enter a coupon code');
      return;
    }
    const token = getValidToken();
    if (!token) {
      setShowAuth(true);
      return;
    }
    setCouponState((s) => ({ ...s, loading: true, message: '' }));
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/coupons/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code,
            tourId,
            subtotal: subtotalAmount,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (isAuthErrorResponse(res.status, data?.message)) {
          clearAuth('expired');
        }
        throw new Error(data?.message || 'Coupon not valid');
      }
      const payload = data.data || data;
      applyCoupon(
        { code: payload.code, discount: payload.discount || 0 },
        payload.message || 'Coupon applied',
      );
      toast.success(payload.message || 'Coupon applied');
    } catch (err) {
      console.error(err);
      setCouponState({ applied: null, loading: false, message: err.message });
      toast.error(err.message || 'Coupon not valid');
    }
  };

  const handleSendEnquiry = async (payload) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/enquiries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          tour: tourId,
          tourCreatedBy: creatorId,
        }),
      },
    );

    const result = await res.json();

    if (!result.success) {
      console.error('Failed to send enquiry');
      return;
    }

    setShowDialog(false);
    toast.success('Enquiry sent successfully');
  };

  const handleConfirmPayment = async ({
    selectedPayment,
    finalPayable,
    coupon,
  }) => {
    const token = getValidToken();

    // 🔐 1. Login check
    if (!token) {
      setShowBookingModal(false);
      setShowAuth(true);
      return;
    }

    const appliedCoupon = coupon || couponState.applied;
    const discountAmount = Math.min(
      subtotalAmount,
      Number(appliedCoupon?.discount || 0),
    );
    const netTaxableAmount = roundMoney(Math.max(0, subtotalAmount - discountAmount));
    const netGstAmount = roundMoney((netTaxableAmount * gstRate) / 100);
    const netAmount = roundMoney(netTaxableAmount + netGstAmount);

    const partialTotalOverride = Number(
      paymentConfig?.partial?.totalAmount || 0,
    );
    const basePartialAmount = paymentConfig?.partial?.enabled
      ? partialTotalOverride > 0
        ? partialTotalOverride
        : Number(paymentConfig.partial.price || 0) * totalGuests
      : netAmount;
    const partialRatio = subtotalAmount > 0 ? basePartialAmount / subtotalAmount : 1;
    const discountedPartial = Math.min(
      Math.max(0, Math.round(netAmount * partialRatio)),
      netAmount,
    );

    try {
      setBookingProcessing(true);

      const partialAmount =
        selectedPayment === 'partial' ? discountedPartial : null;

      console.log(
        'Booking Payment Details:',
        selectedPayment,
        finalPayable,
        partialAmount,
      );

      // 2️⃣ CREATE BOOKING (PENDING)
      const bookingRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tour: tourId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            guests,
            totalPersons: totalGuests,
            contactInfo: { name, email, phone },
            payment: {
              paymentMode: selectedPayment,
              partialAmount,
              totalAmount: netAmount,
              amountPaid: 0,
              remainingAmount: netAmount,
            },
            couponCode: appliedCoupon?.code || undefined,
            bookingStatus: 'pending',
          }),
        },
      );

      const bookingData = await bookingRes.json();
      console.log('Booking Response:', bookingData);

      if (!bookingData?.success) {
        if (isAuthErrorResponse(bookingRes.status, bookingData?.message)) {
          clearAuth('expired');
          setShowAuth(true);
        }
        throw new Error(bookingData?.message || 'Booking creation failed');
      }

      const bookingId = bookingData.data.id;

      // 3️⃣ CREATE RAZORPAY ORDER
      const order = await createPayment({
        gateway: 'razorpay',
        bookingId,
        paymentMode: selectedPayment,
      });

      console.log('Razorpay Order:', order);

      if (!order || !order.id) {
        throw new Error('Razorpay order creation failed');
      }

      // 4️⃣ OPEN RAZORPAY
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: tourName,
        description: 'Tour Booking',
        prefill: {
          name,
          email,
          contact: phone,
        },
        modal: {
          ondismiss: () => {
            toast.error(
              'Payment was cancelled. No payment was taken.',
            );
          },
        },
        handler: async function (response) {
          console.log('Final Payable Amount:', finalPayable);

          await verifyAndConfirmBooking({
            bookingId,
            response,
            token,
            finalPayable,
            paymentMode: selectedPayment,
          });
        },
      };

      console.log('Razorpay Options:', options);

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBookingProcessing(false);
    }
  };

  const verifyAndConfirmBooking = async ({
    bookingId,
    response,
    token,
    finalPayable,
    paymentMode,
  }) => {
    // 5️⃣ VERIFY PAYMENT
    const verifyRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/payment/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          paymentMode,
        }),
      },
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      if (isAuthErrorResponse(verifyRes.status, verifyData?.message)) {
        clearAuth('expired');
        setShowAuth(true);
      }
      toast.error('Payment verification failed');
      return;
    }

    // ✅ DONE
    setShowBookingModal(false);
    toast.success('Booking confirmed successfully!');
  };

  return (
    <>
      <Card className='w-full max-w-2xl shadow-xs border-border'>
        <CardHeader className='flex flex-col gap-1'>
          <h2 className='text-lg sm:text-xl md:text-2xl font-semibold text-foreground'>
            Book Your Journey
          </h2>
          <CardDescription className='text-sm sm:text-base text-muted-foreground'>
            Select your travel dates and number of guests
          </CardDescription>
        </CardHeader>

        <CardContent className='flex flex-col gap-4'>
          {/* Tab Selector */}
          {tourType === 'both' && (
            <Tabs
              value={selectedTab}
              onValueChange={handleTabChange}
              className='w-full'>
              <TabsList className='grid w-full grid-cols-2 text-sm sm:text-base'>
                <TabsTrigger value='fixed_date'>Fixed Date</TabsTrigger>
                <TabsTrigger value='flexible_date'>Flexible Date</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {/* Date Range Picker */}
          <div className='flex text-muted-foreground hover:text-primary flex-col gap-2'>
            <Label
              htmlFor='dates'
              className='text-sm sm:text-base font-medium text-muted-foreground'>
              Travel Dates
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id='dates'
                  disabled={selectedTab === 'fixed_date'}
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left text-muted-foreground hover:text-primary font-normal h-12 border-input hover:bg-gray-100 transition-colors text-sm sm:text-base',
                    !dateRange && 'text-muted-foreground',
                  )}>
                  <CalendarIcon className='mr-2 h-4 w-4 text-primary  ' />
                  {dateRange?.startDate ? (
                    dateRange.endDate ? (
                      <>
                        {format(dateRange.startDate, 'MMM d, yyyy')} -{' '}
                        {format(dateRange.endDate, 'MMM d, yyyy')}
                      </>
                    ) : (
                      format(dateRange.startDate, 'MMM d, yyyy')
                    )
                  ) : (
                    <span className='text-muted-foreground hover:text-primary'>
                      Pick your dates
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  initialFocus
                  mode='single'
                  defaultMonth={dateRange?.startDate}
                  selected={dateRange?.startDate}
                  onSelect={handleSelect}
                  disabled={(date) => date < new Date()}
                  className='pointer-events-auto'
                  classNames={{
                    day_selected:
                      'bg-primary  text-white hover:bg-gray-100  focus:bg-primary ',
                    day_today: 'border border-primary ',
                    day: 'hover:bg-orange-100',
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Guests Selector */}
          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='guests'
              className='text-sm sm:text-base font-medium text-muted-foreground'>
              Guests
            </Label>
            <Button
              id='guests'
              variant='outline'
              onClick={() => setShowGuestDetails(!showGuestDetails)}
              className='w-full  justify-start text-left font-normal text-muted-foreground hover:text-primary h-12 border-input hover:bg-gray-100 transition-colors text-sm sm:text-base'>
              <Users className='mr-2 h-4 w-4 text-primary ' />
              {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'}
            </Button>

            {showGuestDetails && (
              <div className='mt-3 p-4 border border-border rounded-lg bg-card flex flex-col gap-4'>
                {/* Adults */}
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium text-foreground text-sm sm:text-base'>
                      Adults
                    </p>
                    <p className='text-xs sm:text-sm text-muted-foreground'>
                      Ages 13+
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Button
                      size='icon'
                      variant='outline'
                      onClick={() => decrement('adults')}
                      disabled={guests.adults <= 1}
                      className='h-8 w-8 sm:h-9 sm:w-9 rounded-full border-input hover:bg-gray-100'>
                      <Minus className='h-4 w-4 text-primary ' />
                    </Button>
                    <span className='w-6 sm:w-8 text-center font-medium text-foreground text-sm sm:text-base'>
                      {guests.adults}
                    </span>
                    <Button
                      size='icon'
                      variant='outline'
                      onClick={() => increment('adults')}
                      disabled={guests.adults >= 10}
                      className='h-8 w-8 sm:h-9 sm:w-9 rounded-full border-input hover:bg-gray-100'>
                      <Plus className='h-4 w-4 text-primary ' />
                    </Button>
                  </div>
                </div>

                {/* Children */}
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium text-foreground text-sm sm:text-base'>
                      Children
                    </p>
                    <p className='text-xs sm:text-sm text-muted-foreground'>
                      Ages 0–12
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Button
                      size='icon'
                      variant='outline'
                      onClick={() => decrement('children')}
                      disabled={guests.children <= 0}
                      className='h-8 w-8 sm:h-9 sm:w-9 rounded-full border-input hover:bg-gray-100'>
                      <Minus className='h-4 w-4 text-primary ' />
                    </Button>
                    <span className='w-6 sm:w-8 text-center font-medium text-foreground text-sm sm:text-base'>
                      {guests.children}
                    </span>
                    <Button
                      size='icon'
                      variant='outline'
                      onClick={() => increment('children')}
                      disabled={guests.children >= 10}
                      className='h-8 w-8 sm:h-9 sm:w-9 rounded-full border-input hover:bg-gray-100'>
                      <Plus className='h-4 w-4 text-primary ' />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Coupon */}
          <div className='flex flex-col gap-2'>
            <Label className='text-sm sm:text-base font-medium text-muted-foreground flex items-center gap-2'>
              <BadgePercent className='h-4 w-4 text-primary' />
              Coupon
            </Label>
            <div className='flex gap-2'>
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder='SAVE10'
                className='flex-1'
              />
              <Button
                type='button'
                variant='outline'
                onClick={handleApplyCouponCode}
                disabled={couponState.loading}>
                {couponState.loading ? 'Checking...' : 'Apply'}
              </Button>
            </div>

            {couponState.applied && (
              <div className='text-sm text-green-600'>
                Applied {couponState.applied.code} (₹
                {couponState.applied.discount} off)
              </div>
            )}
            {!couponState.applied && couponState.message && (
              <div className='text-sm text-muted-foreground'>
                {couponState.message}
              </div>
            )}
          </div>
          {/* Action Buttons */}{' '}
          {showBookingBtn &&
            (effectiveType !== 'fixed_date' ? (
              <Button
                onClick={() => {
                  if (!dateRange?.startDate || !dateRange?.endDate) {
                    toast.error('Please select travel dates');
                    return;
                  }
                  setShowDialog(true);
                }}
                className='w-full h-11 sm:h-12 bg-primary text-white font-medium'>
                Send Enquiry
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!isLoggedIn) {
                    setShowAuth(true);
                    return;
                  }
                  setShowBookingModal(true);
                }}
                className='w-full h-11 sm:h-12 bg-primary text-white font-medium'>
                {isLoggedIn ? 'Book Now' : 'Login'}
              </Button>
            ))}
        </CardContent>
      </Card>

      {/* Dialog */}
      <EnquiryDialog
        open={showDialog}
        setOpen={setShowDialog}
        basePrice={basePrice}
        guests={guests} // ✅ object { adults, children }
        dateRange={dateRange}
        onSubmit={handleSendEnquiry}
      />

      {/* Payment Modal */}
      <PaymentDialog
        showBookingModal={showBookingModal}
        setShowBookingModal={setShowBookingModal}
        tourName={tourName}
        tourLocation={tourLocation}
        dateRange={dateRange}
        guests={guests}
        amount={subtotalAmount} // full price before discount/tax
        gstPercent={gstRate}
        paymentMode='full' // default
        paymentConfig={paymentConfig}
        coupon={couponState.applied}
        availableCoupons={availableCoupons}
        couponsLoading={couponsLoading}
        onSelectCoupon={handleCouponSelectFromDropdown}
        onConfirmPayment={handleConfirmPayment}
      />
      <BookingProcessingOverlay
        open={bookingProcessing}
        text='Processing your booking...'
      />
      <AuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
        onAuthSuccess={() => {
          setShowAuth(false);

          // 🔁 Resume booking automatically
          if (pendingBookingPayload) {
            handleConfirmPayment(pendingBookingPayload);
            setPendingBookingPayload(null);
          }
        }}
      />
    </>
  );
}
