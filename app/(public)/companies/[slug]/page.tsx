'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ShipmentCard, ShipmentCardData } from '@/components/shipment-card';
import { publicApi } from '@/lib/api';
import { companyApi } from '@/lib/company-api';
import { toast } from '@/lib/toast';
import { isShipmentAvailable } from '@/lib/utils';
import { 
  Building2, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  Star, 
  Loader2, 
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  Package
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { getStoredUser, hasRoleAccess } from '@/lib/auth';

interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  country: string;
  city: string;
  website?: string;
  logoUrl?: string;
  isVerified: boolean;
  rating?: number | null;
  reviewCount: number;
}

interface Review {
  id: string;
  bookingId: string;
  companyId: string;
  customerId: string;
  rating: number;
  comment?: string;
  companyReply?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
  };
  booking?: {
    id: string;
    shipmentSlot?: {
      id: string;
      originCity: string;
      destinationCity: string;
    };
  };
}

export default function CompanyProfilePage() {
  const params = useParams();
  const companySlug = params.slug as string;
  
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [shipments, setShipments] = useState<ShipmentCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: false,
  });
  const [shipmentsPagination, setShipmentsPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: false,
  });
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    // Check if current user owns this company
    const user = getStoredUser();
    if (user && hasRoleAccess(user.role, ['COMPANY_ADMIN', 'COMPANY_STAFF'])) {
      setIsCompanyOwner(user.company?.slug === companySlug || user.company?.id === companySlug);
    }

    fetchCompanyProfile();
    fetchReviews();
  }, [companySlug]);

  // Fetch shipments after company is loaded so we can add company info
  useEffect(() => {
    if (company) {
      fetchShipments();
    }
  }, [company]);

  const fetchCompanyProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await publicApi.getCompanyProfile(companySlug);
      setCompany(data);
    } catch (err) {
      console.error('Failed to fetch company profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (resetOffset = true) => {
    setReviewsLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        offset: resetOffset ? 0 : pagination.offset,
      };
      const response = await publicApi.getCompanyReviews(companySlug, params);
      if (resetOffset) {
        setReviews(response.data);
      } else {
        setReviews([...reviews, ...response.data]);
      }
      setPagination(response.pagination);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchShipments = async (resetOffset = true) => {
    setShipmentsLoading(true);
    try {
      // Calculate the correct offset: if loading more, use current offset + limit
      const currentOffset = resetOffset ? 0 : shipmentsPagination.offset + shipmentsPagination.limit;
      const params = {
        limit: shipmentsPagination.limit,
        offset: currentOffset,
      };
      const response = await publicApi.getCompanyShipments(companySlug, params);
      
      // Response structure: { status: "success", data: [...], pagination: {...} }
      const shipmentsData = response.data || [];
      
      // Filter out unavailable shipments (past cutoff/departure time)
      // and add company info to each shipment for ShipmentCard component
      const availableShipments = shipmentsData
        .filter((shipment: any) =>
          isShipmentAvailable({
            cutoffTimeForReceivingItems: shipment.cutoffTimeForReceivingItems,
            departureTime: shipment.departureTime,
          })
        )
        .map((shipment: any) => ({
          ...shipment,
          remainingCapacity: shipment.remainingCapacityKg || shipment.remainingCapacityItems,
          remainingCapacityKg: shipment.remainingCapacityKg,
          capacityUnit: shipment.remainingCapacityKg ? 'kg' : 'items',
          company: company ? {
            id: company.id,
            slug: company.slug,
            name: company.name,
            rating: company.rating || undefined,
            logoUrl: company.logoUrl || undefined,
          } : undefined,
        }));
      
      if (resetOffset) {
        setShipments(availableShipments);
      } else {
        setShipments([...shipments, ...availableShipments]);
      }
      
      // Update pagination with the response, but keep track of the actual offset we used
      if (response.pagination) {
        setShipmentsPagination({
          ...response.pagination,
          offset: currentOffset, // Use the offset we actually sent to the API
        });
      }
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
      // If the endpoint doesn't exist yet, just set empty array
      setShipments([]);
    } finally {
      setShipmentsLoading(false);
    }
  };

  const loadMoreShipments = () => {
    fetchShipments(false);
  };

  const loadMoreReviews = () => {
    fetchReviews(false);
  };

  const openReplyDialog = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.companyReply || '');
    setReplyDialogOpen(true);
  };

  const closeReplyDialog = () => {
    setReplyDialogOpen(false);
    setSelectedReview(null);
    setReplyText('');
  };

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      if (selectedReview.companyReply) {
        // Update existing reply
        await companyApi.updateReviewReply(selectedReview.bookingId, replyText);
      } else {
        // Create new reply
        await companyApi.replyToReview(selectedReview.bookingId, replyText);
      }
      
      // Refresh reviews to show the updated reply
      await fetchReviews(true);
      closeReplyDialog();
      toast.success('Reply submitted successfully');
    } catch (err) {
      console.error('Failed to submit reply:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit reply');
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
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Company not found</p>
                <p className="text-sm text-gray-500 mb-4">
                  {error || 'The company profile you are looking for does not exist.'}
                </p>
                <Link href="/">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          {/* Company Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                {company.logoUrl && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border">
                    <Image
                      src={company.logoUrl}
                      alt={`${company.name} logo`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}

                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
                      <div className="flex items-center gap-3 flex-wrap">
                        {company.isVerified && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Verified
                          </Badge>
                        )}
                        {company.rating !== null && company.rating !== undefined && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {company.rating.toFixed(1)}
                            <span className="text-gray-500 ml-1">
                              ({company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isCompanyOwner && (
                      <Link href="/company/settings">
                        <Button variant="outline" size="sm">
                          Edit Profile
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Description */}
                  {company.description && (
                    <p className="text-gray-600 mb-4">{company.description}</p>
                  )}

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{company.city}, {company.country}</span>
                    </div>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-orange-600 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Slots and Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="live-slots" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="live-slots" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Live Slots
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Reviews
                    {company.reviewCount > 0 && (
                      <span className="text-xs text-gray-500">
                        ({company.reviewCount})
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                {/* Live Slots Tab */}
                <TabsContent value="live-slots" className="mt-6">
                  {shipmentsLoading && shipments.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                    </div>
                  ) : shipments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No live slots available</p>
                      <p className="text-sm mt-1">This company hasn&apos;t published any shipment slots yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shipments.map((shipment) => (
                        <ShipmentCard key={shipment.id} shipment={shipment} />
                      ))}
                      
                      {shipmentsPagination.hasMore && (
                        <div className="mt-6 text-center">
                          <Button
                            variant="outline"
                            onClick={loadMoreShipments}
                            disabled={shipmentsLoading}
                          >
                            {shipmentsLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load More Slots'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                {/* Reviews Tab */}
                <TabsContent value="reviews" className="mt-6">
                  <div className="mb-4">
                    {company.rating !== null && company.rating !== undefined && (
                      <CardDescription>
                        Average rating: {company.rating.toFixed(1)} out of 5
                      </CardDescription>
                    )}
                  </div>
                  
                  {reviewsLoading && reviews.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No reviews yet</p>
                      <p className="text-sm mt-1">Be the first to review this company!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{review.customer.fullName}</p>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-600 mt-2 text-sm">{review.comment}</p>
                          )}
                          {review.booking?.shipmentSlot && (
                            <p className="text-xs text-gray-400 mt-1">
                              Route: {review.booking.shipmentSlot.originCity} → {review.booking.shipmentSlot.destinationCity}
                            </p>
                          )}
                          
                          {/* Company Reply Section */}
                          {review.companyReply && (
                            <div className="mt-3 pl-4 border-l-2 border-orange-200 bg-orange-50 rounded p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm text-orange-900">Company Response</p>
                                <span className="text-xs text-orange-600">
                                  {format(new Date(review.updatedAt), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <p className="text-sm text-orange-800">{review.companyReply}</p>
                            </div>
                          )}
                          
                          {/* Reply Button (for company owners) */}
                          {isCompanyOwner && (
                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openReplyDialog(review)}
                                className="text-xs"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {review.companyReply ? 'Edit Reply' : 'Reply'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {pagination.hasMore && (
                        <div className="mt-6 text-center">
                          <Button
                            variant="outline"
                            onClick={loadMoreReviews}
                            disabled={reviewsLoading}
                          >
                            {reviewsLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load More Reviews'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.companyReply ? 'Edit Reply' : 'Reply to Review'}
            </DialogTitle>
            <DialogDescription>
              {selectedReview?.companyReply 
                ? 'Update your response to this customer review.'
                : 'Write a response to this customer review. Your reply will be visible to all visitors.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-sm">{selectedReview.customer.fullName}</p>
                  <span className="text-xs text-gray-500">
                    {format(new Date(selectedReview.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
                {renderStars(selectedReview.rating)}
                {selectedReview.comment && (
                  <p className="text-sm text-gray-600 mt-2">{selectedReview.comment}</p>
                )}
              </div>
            )}
            <Textarea
              placeholder="Write your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {replyText.length}/1000 characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReplyDialog} disabled={submittingReply}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReply} 
              disabled={submittingReply || !replyText.trim()}
            >
              {submittingReply ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                selectedReview?.companyReply ? 'Update Reply' : 'Submit Reply'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

