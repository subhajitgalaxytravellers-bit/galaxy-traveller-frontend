'use client';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Star, Upload, X, Image as ImageIcon } from 'lucide-react';
import AuthDialog from '../Auth/authDialog';
import { Base_Url } from '@/api/client';
import Image from 'next/image';

// ---------- constants ----------
const API_BASE = `${Base_Url}`.replace(/\/+$/, '');
const SIGN_ENDPOINT = `${API_BASE}/api/images/sign-upload`;

// ---------- helpers ----------
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

async function uploadFileToGCS(file, folder, token) {
  if (file.size > 10 * 1024 * 1024)
    throw new Error(`${file.name} exceeds 10MB`);

  const { uploadUrl, publicUrl } = await signUpload({
    folder,
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

export default function MakeReview({ tourIdOrSlug }) {
  // auth
  const [authOpen, setAuthOpen] = useState(false);
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const pendingSubmitRef = useRef(false);

  // review form
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // read token
  useEffect(() => {
    try {
      const t = localStorage.getItem('token') || '';
      if (t) setToken(t);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        if (!reviewerName && parsed?.name) {
          setReviewerName(parsed.name);
        }
      }
    } catch {}
  }, [reviewerName]);

  const onAuthSuccess = ({ token: t, user }) => {
    localStorage.setItem('token', t);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
    }
    setToken(t);
    setAuthOpen(false);
    if (!reviewerName && user?.name) setReviewerName(user.name);
    if (pendingSubmitRef.current) {
      pendingSubmitRef.current = false;
      void doSubmit(t);
    }
  };

  const doSubmit = async (tk = token) => {
    const endpoint = tourIdOrSlug
      ? `${API_BASE}/api/tour/${encodeURIComponent(tourIdOrSlug)}/reviews`
      : null;

    if (!endpoint) {
      alert('Missing tour id/slug');
      return;
    }

    const text = reviewContent.trim();
    if (text.length < 10) return alert('Review must be at least 10 chars.');
    if (rating < 1 || rating > 5) return alert('Pick 1–5 stars.');
    if (!reviewerName.trim()) return alert('Please provide your name.');

    const payload = {
      name: reviewerName.trim(),
      heading: reviewTitle.trim(),
      review: text,
      stars: rating,
      img: uploadedImages.slice(0, 3),
    };

    try {
      setSubmitting(true);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tk}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      alert(
        'Thank you for your review! It will be published after moderation.',
      );
      setRating(0);
      setReviewTitle('');
      setReviewContent('');
      setReviewerName('');
      setUploadedImages([]);
    } catch (err) {
      console.error('Review submit failed:', err);
      alert(err?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      pendingSubmitRef.current = true;
      setAuthOpen(true);
      return;
    }
    await doSubmit(token);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 3 - uploadedImages.length;
    const toUpload = files
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);

    if (!toUpload.length) return;

    try {
      const folder = `reviews/tours/${tourIdOrSlug || 'unknown'}`;
      const urls = await Promise.all(
        toUpload.map((file) => uploadFileToGCS(file, folder, token)),
      );
      setUploadedImages((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error('upload failed', err);
      alert(err.message || 'Failed to upload image(s)');
    } finally {
      setShowImageUpload(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const renderStarRating = () =>
    Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type='button'
        className='focus:outline-none'
        onMouseEnter={() => setHoveredRating(i + 1)}
        onMouseLeave={() => setHoveredRating(0)}
        onClick={() => setRating(i + 1)}
        data-testid={`star-${i + 1}`}>
        <Star
          className={`h-6 w-6 transition-colors ${
            i < (hoveredRating || rating)
              ? 'fill-primary text-primary'
              : 'text-gray-300 hover:text-primary'
          }`}
        />
      </button>
    ));

  return (
    <>
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthSuccess={onAuthSuccess}
      />

      <Card className='p-0 py-6 mt-4 border border-gray-100 mb-8 w-full mx-auto sm:px-4'>
        <CardHeader className='px-4 sm:px-6'>
          <CardTitle className='text-lg sm:text-xl'>Write a Review</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Share your experience with other travelers
          </p>
        </CardHeader>

        <CardContent className='px-4 sm:px-6'>
          {!token && (
            <div className='mb-4 rounded-md border border-secondary bg-secondary/20 p-3 text-sm'>
              You’re not signed in.{' '}
              <button
                type='button'
                className='underline text-primary '
                onClick={() => setAuthOpen(true)}>
                Sign in to post a review
              </button>
              .
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className='space-y-5 flex flex-col gap-4 w-full'>
            {/* Rating */}
            <div>
              <label className='text-sm font-medium mb-2 block'>
                Your Rating
              </label>
              <div
                className='flex gap-1 text-primary [&_svg]:text-primary'
                onMouseLeave={() => setHoveredRating(0)}>
                {renderStarRating()}
              </div>
            </div>

            {/* Name */}
            <div className='w-full'>
              <label className='text-sm font-medium mb-2 block'>
                Your Name
              </label>
              <Input
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder='Enter your name'
                required
                data-testid='input-reviewer-name'
                className='w-full py-3 px-4 border border-gray-100 rounded-md'
              />
            </div>

            {/* Review Title */}
            <div className='w-full'>
              <label className='text-sm font-medium mb-2 block'>
                Review Title
              </label>
              <Input
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder='Summarize your experience'
                required
                data-testid='input-review-title'
                className='w-full py-3 px-4 border border-gray-100 rounded-md'
              />
            </div>

            {/* Review Content */}
            <div className='w-full'>
              <label className='text-sm font-medium mb-2 block'>
                Your Review
              </label>
              <Textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder='Tell us about your experience on this tour...'
                rows={4}
                required
                data-testid='textarea-review-content'
                className='block wrap-anywhere  min-h-[120px] sm:min-h-[160px] resize-none py-3 px-4 border border-gray-100 rounded-md overflow-y-auto '
              />
            </div>

            {/* Image Upload */}
            <div className='w-full'>
              <label className='text-sm font-medium mb-2 block'>
                Add Photos (Optional - Max 3 images)
              </label>

              {uploadedImages.length > 0 && (
                <div className='flex flex-wrap gap-2 mb-3'>
                  {uploadedImages.map((image, index) => (
                    <div key={index} className='relative'>
                      <Image
                        src={image}
                        alt={`Upload ${index + 1}`}
                        width={80}
                        height={80}
                        className='w-20 h-20 object-cover rounded-lg'
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        size='icon'
                        className='absolute -top-2 -right-2 h-6 w-6'
                        onClick={() => removeImage(index)}>
                        <X className='h-3 w-3' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length < 3 && (
                <Dialog
                  open={showImageUpload}
                  onOpenChange={setShowImageUpload}>
                  <DialogTrigger asChild>
                    <Button
                      type='button'
                      disabled={!token}
                      variant='outline'
                      className='w-full border-dashed border-gray-200'
                      data-testid='button-add-images'>
                      <ImageIcon className='mr-2 h-5 w-5 text-primary' />
                      Add Photos ({uploadedImages.length}/3)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='border border-gray-100 max-w-sm sm:max-w-md'>
                    <DialogHeader>
                      <DialogTitle className='text-primary '>
                        Upload Images
                      </DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div className='border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:shadow-sm'>
                        <Upload className='h-8 w-8 mx-auto mb-2 text-primary' />
                        <p className='text-sm text-gray-600 mb-2'>
                          Drag and drop images here, or click to select
                        </p>
                        <p className='text-xs text-gray-400 mb-4'>
                          Maximum 3 images, up to 10MB each
                        </p>
                        <input
                          type='file'
                          multiple
                          accept='image/*'
                          onChange={handleImageUpload}
                          className='hidden'
                          id='image-upload'
                          data-testid='input-image-upload'
                        />
                        <label htmlFor='image-upload'>
                          <Button
                            type='button'
                            asChild
                            className='px-4 py-2 text-md'>
                            <span>Choose Images</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <Button
              type='submit'
              className='w-full py-3 text-md bg-primary  hover:bg-primary /90'
              disabled={
                !rating ||
                !reviewTitle ||
                !reviewContent ||
                !reviewerName ||
                submitting
              }
              data-testid='button-submit-review'>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
