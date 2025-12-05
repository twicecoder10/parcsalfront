'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import { format } from 'date-fns';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch booking details
      const bookingData = await customerApi.getBookingById(bookingId);
      setBooking(bookingData);

      // Check if review already exists
      try {
        const reviewData = await customerApi.getReviewByBookingId(bookingId);
        setExistingReview(reviewData);
        setRating(reviewData.rating);
        setComment(reviewData.comment || '');
      } catch (err: any) {
        // Review doesn't exist yet, which is fine
        if (err.response?.status !== 404) {
          console.error('Error checking for existing review:', err);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canReview = () => {
    if (!booking) return false;
    const allowedStatuses = ['REJECTED', 'CANCELLED', 'DELIVERED'];
    return allowedStatuses.includes(booking.status);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let reviewResponse;
      if (existingReview) {
        // Update existing review
        reviewResponse = await customerApi.updateReview(bookingId, {
          rating,
          comment: comment || null,
        });
      } else {
        // Create new review
        reviewResponse = await customerApi.createReview(bookingId, {
          rating,
          comment: comment.trim() || undefined,
        });
      }

      // Use the returned review data directly instead of refetching
      setExistingReview(reviewResponse);
      setRating(reviewResponse.rating);
      setComment(reviewResponse.comment || '');
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    if (!confirm('Are you sure you want to delete your review?')) return;

    setDeleting(true);
    setError(null);

    try {
      await customerApi.deleteReview(bookingId);
      setExistingReview(null);
      setRating(0);
      setComment('');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to delete review:', err);
      setError(err.message || 'Failed to delete review. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const renderStars = (forRating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || submitting}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={`transition-colors ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            }`}
          >
            <Star
              className={`h-8 w-8 ${
                star <= (interactive ? (hoveredRating || rating) : forRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Booking not found</p>
            <Link href="/customer/bookings">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canReview()) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link href={`/customer/bookings/${bookingId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Booking
          </Button>
        </Link>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-900">Review Not Available</p>
                <p className="text-sm text-orange-700 mt-1">
                  Reviews can only be created for bookings with status: REJECTED, CANCELLED, or DELIVERED.
                  Your booking status is: <Badge className="ml-1">{booking.status}</Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/customer/bookings/${bookingId}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking
        </Button>
      </Link>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Route</span>
              <span className="font-medium">
                {booking.shipmentSlot?.originCity || 'N/A'} → {booking.shipmentSlot?.destinationCity || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Company</span>
              <span className="font-medium">
                {booking.shipmentSlot?.company?.name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge>{booking.status}</Badge>
            </div>
            {booking.createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Booking Date</span>
                <span className="text-sm">
                  {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {existingReview ? 'Update Your Review' : 'Write a Review'}
          </CardTitle>
          <CardDescription>
            Share your experience with this shipping service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success && !existingReview && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800">Review submitted successfully!</p>
              </div>
            </div>
          )}

          {success && existingReview && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800">Review updated successfully!</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating <span className="text-red-500">*</span></Label>
            {renderStars(rating, true)}
            {rating > 0 && (
              <p className="text-sm text-gray-500">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this shipping service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              maxLength={1000}
              disabled={submitting}
            />
            <p className="text-xs text-gray-500">
              {comment.length} / 1000 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting || deleting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {existingReview ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                existingReview ? 'Update Review' : 'Submit Review'
              )}
            </Button>

            {existingReview && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting || deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Review'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

