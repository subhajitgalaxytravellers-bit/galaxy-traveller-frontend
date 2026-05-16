import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

import CustomGoogleButton from './GoogleBtn';
import { toast } from 'react-toastify';

import { useMutation } from '@tanstack/react-query';
import { post, setToken } from '@/api/client';

function AuthDialog({ open, onOpenChange, onAuthSuccess }) {
  const [selectedTab, setSelectedTab] = useState('login');
  const [showOtp, setShowOtp] = useState(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef(null);

  const API_BASE = process.env.NEXT_PUBLIC_API?.replace(/\/$/, '') || '';

  // RESET FORM
  const resetForm = () => {
    setEmail('');
    setName('');
    setOtp('');
    setShowOtp(false);
    setResendIn(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startResendTimer = (sec = 30) => {
    setResendIn(sec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // --------------------------------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------------------------------
  const handleGoogleSuccess = async (googleData) => {
    try {
      const token = googleData?.access_token;
      if (!token) throw new Error('Google did not return a token');

      const res = await post('/auth/google', { token });
      const data = res.data;

      setToken(data.token, data.user);

      toast.success('Signed in successfully!');
      onAuthSuccess?.(data);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || 'Google login failed');
    }
  };

  // --------------------------------------------------------------------------
  // REQUEST OTP
  // --------------------------------------------------------------------------
  const requestOtp = useMutation({
    mutationFn: async () =>
      (
        await post('/auth/request-otp', {
          email,
          type: selectedTab,
          name: selectedTab === 'signup' ? name : undefined,
        })
      ).data,
    onSuccess: () => {
      setShowOtp(true);
      startResendTimer();
      toast.success('OTP sent to your email!');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    },
  });

  // --------------------------------------------------------------------------
  // VERIFY OTP
  // --------------------------------------------------------------------------
  const verifyOtp = useMutation({
    mutationFn: async () =>
      (
        await post('/auth/verify-otp', {
          email,
          otp,
          type: selectedTab,
          name: selectedTab === 'signup' ? name : undefined,
        })
      ).data,
    onSuccess: (data) => {
      setToken(data.token, data.user);
      toast.success('Logged in!');
      onAuthSuccess?.(data);
      resetForm();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'OTP verification failed');
    },
  });

  // --------------------------------------------------------------------------
  // EMAIL SUBMIT (login/signup)
  // --------------------------------------------------------------------------
  const handleEmailSubmit = () => {
    if (!email) return toast.error('Enter your email');
    if (selectedTab === 'signup' && !name)
      return toast.error('Enter your name');
    requestOtp.mutate();
  };

  // --------------------------------------------------------------------------
  // RESEND OTP
  // --------------------------------------------------------------------------
  const handleResend = () => {
    if (resendIn > 0) return;
    requestOtp.mutate();
  };

  const handleTabChange = (v) => {
    setSelectedTab(v);
    setShowOtp(false);
    setOtp('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='font-heading text-2xl text-center font-semibold tracking-tight'>
            {selectedTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-6 py-4'>
          {/* GOOGLE BUTTON */}
          <CustomGoogleButton
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google login failed')}
          />

          {/* Divider */}
          <div className='relative my-2'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='px-2 bg-background text-muted-foreground'>
                Or continue with email
              </span>
            </div>
          </div>

          {/* TABS */}
          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsList className='grid grid-cols-2 w-full'>
              <TabsTrigger value='login' className='font-heading tracking-tight'>Login</TabsTrigger>
              <TabsTrigger value='signup' className='font-heading tracking-tight'>Sign Up</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value='login' className='mt-4 space-y-4'>
              {!showOtp ? (
                <>
                  <Label>Email</Label>
                  <Input
                    placeholder='you@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Button
                    className={'w-full'}
                    onClick={handleEmailSubmit}
                    disabled={requestOtp.isPending}>
                    {requestOtp.isPending ? 'Sending...' : 'Send OTP'}
                  </Button>
                </>
              ) : (
                <>
                  <Label>Enter OTP</Label>

                  <InputOTP
                    className={'w-full'}
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}>
                    <InputOTPGroup className={'w-full'}>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot className={'w-full'} key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>

                  <Button
                    className={'w-full'}
                    onClick={() => verifyOtp.mutate()}
                    disabled={verifyOtp.isPending}>
                    {verifyOtp.isPending ? 'Verifying...' : 'Verify OTP'}
                  </Button>

                  <div className='flex justify-between'>
                    <Button variant='ghost' onClick={() => setShowOtp(false)}>
                      Back
                    </Button>

                    <Button
                      variant='ghost'
                      onClick={handleResend}
                      disabled={resendIn > 0}>
                      {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value='signup' className='mt-4 space-y-4'>
              {!showOtp ? (
                <>
                  <Label>Name</Label>
                  <Input
                    placeholder='John Doe'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <Label>Email</Label>
                  <Input
                    placeholder='you@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Button
                    className={'w-full'}
                    onClick={handleEmailSubmit}
                    disabled={requestOtp.isPending}>
                    {requestOtp.isPending ? 'Sending...' : 'Send OTP'}
                  </Button>
                </>
              ) : (
                <>
                  <Label className={'w-full'}>Enter OTP</Label>
                  <InputOTP
                    className={'w-full'}
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}>
                    <InputOTPGroup className={'w-full'}>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <Button
                    className={'w-full'}
                    onClick={() => verifyOtp.mutate()}
                    disabled={verifyOtp.isPending}>
                    {verifyOtp.isPending ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <div className='flex justify-between'>
                    <Button variant='ghost' onClick={() => setShowOtp(false)}>
                      Back
                    </Button>

                    <Button
                      variant='ghost'
                      onClick={handleResend}
                      disabled={resendIn > 0}>
                      {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default AuthDialog;
