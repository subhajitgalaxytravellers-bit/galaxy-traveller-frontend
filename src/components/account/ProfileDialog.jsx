'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Loader2, MapPin, Save, User2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { Base_Url, get, patch, post } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const API_BASE = `${Base_Url}`.replace(/\/+$/, '');
const SIGN_ENDPOINT = `${API_BASE}/api/images/sign-upload`;
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

const getInitials = (name = '', email = '') => {
  const source = String(name || email || '').trim();
  if (!source) return 'GT';
  const parts = source.split(' ');
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  return (first + second || first).toUpperCase();
};

async function signUpload({ folder, filename, contentType, token }) {
  const res = await fetch(SIGN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ folder, filename, contentType }),
  });
  if (!res.ok) throw new Error(`Sign failed: ${res.status}`);
  return res.json();
}

async function uploadProfileImage(file, token, userId) {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image exceeds 10MB');
  }
  const { uploadUrl, publicUrl } = await signUpload({
    folder: `users/${userId || 'profile'}`,
    filename: `${Date.now()}-${file.name}`,
    contentType: file.type || 'application/octet-stream',
    token,
  });

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-goog-acl': 'public-read',
    },
    body: file,
  });

  if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
  return publicUrl;
}

export default function ProfileDialog({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    _id: '',
    name: '',
    email: '',
    bio: '',
    location: '',
    profileImg: '',
    countryCode: '+91',
    phone: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const fileInputRef = useRef(null);

  const initials = useMemo(
    () => getInitials(form.name, form.email),
    [form.name, form.email],
  );

  const splitPhone = (raw = '') => {
    const value = String(raw || '').trim();
    if (!value) return { countryCode: '+91', phone: '' };
    const hit = countryCodes.find((c) => value.startsWith(c.code));
    if (!hit) return { countryCode: '+91', phone: value.replace(/^\+/, '') };
    return {
      countryCode: hit.code,
      phone: value.slice(hit.code.length).trim(),
    };
  };

  useEffect(() => {
    if (!open) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await get('/users/me');
        const me = res?.data || {};
        let fullUser = me;
        if (me?._id) {
          try {
            const details = await get(`/users/${me._id}`);
            fullUser = details?.data || me;
          } catch {
            fullUser = me;
          }
        }
        if (!active) return;
        const phoneParts = splitPhone(fullUser.phone || user?.phone || '');
        setForm({
          _id: fullUser._id || user?._id || '',
          name: fullUser.name || user?.name || '',
          email: fullUser.email || user?.email || '',
          bio: fullUser.bio || user?.bio || '',
          location: fullUser.location || user?.location || '',
          profileImg:
            fullUser.profileImg || user?.profileImg || user?.avatar || '',
          countryCode: phoneParts.countryCode,
          phone: phoneParts.phone,
        });
        setOtpSent(false);
        setOtp('');
        setOtpVerified(!!(fullUser.phone || user?.phone));
      } catch (err) {
        if (!active) return;
        toast.error(err?.response?.data?.message || 'Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [open, user?._id, user?.name, user?.email, user?.bio, user?.location, user?.profileImg, user?.avatar]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetPhoneVerification = () => {
    setOtpVerified(false);
    setOtpSent(false);
    setOtp('');
  };

  const fullPhone = `${form.countryCode}${form.phone.trim()}`;

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    const token = localStorage.getItem('token');
    if (!file) return;
    if (!token) {
      toast.error('Please login again');
      return;
    }

    try {
      setUploading(true);
      const url = await uploadProfileImage(file, token, form._id || user?._id);
      setForm((prev) => ({ ...prev, profileImg: url }));
      toast.success('Profile image uploaded');
    } catch (err) {
      toast.error(err?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form._id) {
      toast.error('User id missing. Please login again.');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!otpVerified) {
      toast.error('Please verify your phone number first');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        phone: fullPhone,
        bio: form.bio.trim(),
        location: form.location.trim(),
        profileImg: form.profileImg || '',
      };
      const res = await patch(`/users/${form._id}`, payload);
      const updated = res?.data || {};

      const mergedUser = {
        ...(user || {}),
        ...updated,
        phone: updated.phone || fullPhone,
        avatar: updated.profileImg || updated.avatar || form.profileImg || '',
      };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      onUserUpdated?.(mergedUser);
      toast.success('Profile updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const sendOtp = async () => {
    if (!form.phone.trim() || form.phone.trim().length < 6) {
      toast.error('Enter valid phone number');
      return;
    }
    try {
      setOtpLoading(true);
      await post('/otp/send', { phone: fullPhone });
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
      await post('/otp/verify', { phone: fullPhone, otp });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl border-primary/20 bg-background p-0 overflow-hidden'>
        <div className='h-24 bg-gradient-to-r from-primary/90 via-primary to-primary/80' />

        <div className='px-6 pb-6 -mt-12'>
          <DialogHeader className='text-left'>
            <div className='flex items-end justify-between gap-4'>
              <div className='relative'>
                <Avatar className='h-24 w-24 border-4 border-background shadow-lg'>
                  {form.profileImg ? (
                    <AvatarImage src={form.profileImg} alt={form.name || 'User'} />
                  ) : null}
                  <AvatarFallback className='bg-primary text-primary-foreground text-xl font-semibold'>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <Button
                  type='button'
                  size='icon'
                  className='absolute -bottom-2 -right-2 h-9 w-9 rounded-full'
                  onClick={handlePickImage}
                  disabled={uploading || loading}>
                  {uploading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Camera className='h-4 w-4' />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleImageUpload}
                />
              </div>

              <div className='text-right'>
                <DialogTitle className='text-xl font-bold'>Your Profile</DialogTitle>
                <DialogDescription className='text-sm'>
                  Manage your account details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className='mt-6 grid gap-4'>
            <div>
              <label className='mb-2 flex items-center gap-2 text-sm font-medium'>
                <User2 className='h-4 w-4 text-primary' />
                Full Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder='Your name'
                disabled={loading || saving}
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium'>Email</label>
              <Input value={form.email} disabled className='bg-muted/50' />
              <p className='mt-1 text-xs text-muted-foreground'>
                Email cannot be changed.
              </p>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium'>Phone</label>
              <div className='flex gap-2'>
                <div className='w-36'>
                  <Select
                    value={form.countryCode}
                    disabled={loading || saving}
                    onValueChange={(val) => {
                      onChange('countryCode', val);
                      resetPhoneVerification();
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder='Code' />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={form.phone}
                  onChange={(e) => {
                    onChange('phone', e.target.value);
                    resetPhoneVerification();
                  }}
                  placeholder='Phone number'
                  disabled={loading || saving}
                />
                {!otpSent && !otpVerified && (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={sendOtp}
                    disabled={otpLoading || loading || saving}>
                    Verify
                  </Button>
                )}
              </div>
              {otpSent && !otpVerified && (
                <div className='mt-2 flex gap-2'>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder='Enter OTP'
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
                <p className='mt-1 text-xs text-green-600'>
                  Phone number verified
                </p>
              )}
            </div>

            <div>
              <label className='mb-2 flex items-center gap-2 text-sm font-medium'>
                <MapPin className='h-4 w-4 text-primary' />
                Location
              </label>
              <Input
                value={form.location}
                onChange={(e) => onChange('location', e.target.value)}
                placeholder='City, Country'
                disabled={loading || saving}
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium'>Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => onChange('bio', e.target.value)}
                placeholder='Tell us a bit about yourself'
                rows={4}
                disabled={loading || saving}
              />
            </div>
          </div>

          <div className='mt-6 flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={saving || loading}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleSave}
              disabled={saving || loading || uploading || !otpVerified || !form.phone.trim()}>
              {saving ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Save className='h-4 w-4' />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
