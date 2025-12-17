'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Star, MessageSquare, Loader2, User, Calendar, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { Review, ReviewStats } from '@/lib/company-api';
import { format } from 'date-fns';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const limit = 20;
    try {
      const response = await companyApi.getCompanyReviews({
        limit,
        offset: currentPage * limit,
        rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
      });
      
      setReviews(response?.data || []);
      setPagination(response?.pagination || {
        total: 0,
        limit: 20,
        offset: currentPage * limit,
        hasMore: false,
      });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
      setPagination({
        total: 0,
        limit: 20,
        offset: currentPage * limit,
        hasMore: false,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, ratingFilter]);

  const calculateStatsFromReviews = useCallback((reviewsList: Review[]) => {
    if (!reviewsList || reviewsList.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
      };
    }

    const totalReviews = reviewsList.length;
    const sumRatings = reviewsList.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = sumRatings / totalReviews;

    // Calculate rating distribution
    const ratingDistribution: { [key: number]: number } = {};
    reviewsList.forEach((review) => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  }, []);

  const fetchReviewStats = useCallback(async () => {
    try {
      const statsData = await companyApi.getCompanyReviewStats();
      // Validate and use API stats if they seem valid
      if (statsData && typeof statsData.totalReviews === 'number' && statsData.totalReviews >= 0) {
        setStats(statsData);
      } else {
        // If stats are invalid, use defaults
        setStats({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {},
        });
      }
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
      // Set defaults on error
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
      });
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchReviewStats();
  }, [fetchReviews, fetchReviewStats]);

  // Recalculate stats from reviews when reviews change
  // This ensures stats are accurate even if the stats API returns incorrect data
  useEffect(() => {
    if (reviews.length > 0) {
      const calculatedStats = calculateStatsFromReviews(reviews);
      // Use pagination total for accurate total count (across all pages, not just current page)
      const totalFromPagination = pagination.total > 0 ? pagination.total : reviews.length;
      
      // If current stats show 0 total but we have reviews, update with calculated stats
      if (!stats || stats.totalReviews === 0) {
        setStats({
          ...calculatedStats,
          totalReviews: totalFromPagination,
        });
      }
    } else if (reviews.length === 0 && pagination.total === 0) {
      // If no reviews, ensure stats show 0
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
      });
    }
  }, [reviews, pagination.total, stats, calculateStatsFromReviews]);

  const handleReply = async (review: Review) => {
    if (!replyText.trim()) return;
    
    setSubmittingReply(true);
    try {
      if (review.companyReply) {
        // Update existing reply
        await companyApi.updateReviewReply(review.bookingId, replyText);
      } else {
        // Create new reply
        await companyApi.replyToReview(review.bookingId, replyText);
      }
      
      // Refresh reviews
      await fetchReviews();
      setReplyingTo(null);
      setReplyText('');
    } catch (error: any) {
      console.error('Failed to submit reply:', error);
      const errorMessage = error?.message || 'Failed to submit reply. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-gray-600 mt-2">View and respond to customer reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReviews ?? 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats?.ratingDistribution?.[rating] || 0;
                const total = stats?.totalReviews || 1;
                const percentage = (count / total) * 100;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-xs w-4">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="rating-filter">Filter by Rating</Label>
              <Select value={ratingFilter} onValueChange={(value) => {
                setRatingFilter(value);
                setCurrentPage(0);
              }}>
                <SelectTrigger id="rating-filter">
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>
            Showing {reviews?.length || 0} of {pagination?.total || 0} reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : !reviews || reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reviews found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <span className="font-medium">{review.customer.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      {review.booking?.shipmentSlot && (
                        <div className="text-sm text-gray-600 mb-2">
                          Route: {review.booking.shipmentSlot.originCity} → {review.booking.shipmentSlot.destinationCity}
                        </div>
                      )}
                      
                      {review.comment && (
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                      )}
                      
                      {review.companyReply && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-blue-900">Company Reply</span>
                            <span className="text-xs text-blue-600">
                              {review.updatedAt && format(new Date(review.updatedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-blue-800">{review.companyReply}</p>
                        </div>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant={review.companyReply ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => {
                            setReplyingTo(review.id);
                            setReplyText(review.companyReply || '');
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {review.companyReply ? 'Edit Reply' : 'Reply'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {review.companyReply ? 'Edit Reply' : 'Reply to Review'}
                          </DialogTitle>
                          <DialogDescription>
                            Respond to {review.customer.fullName}&apos;s review
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{review.customer.fullName}</span>
                              {renderStars(review.rating)}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-600 italic">&quot;{review.comment}&quot;</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="reply">Your Reply</Label>
                            <Textarea
                              id="reply"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply here..."
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleReply(review)}
                            disabled={!replyText.trim() || submittingReply}
                          >
                            {submittingReply ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                {review.companyReply ? 'Update Reply' : 'Send Reply'}
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && reviews && reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} reviews
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!pagination.hasMore}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

