'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { publicApi } from '@/lib/api';
import { companyApi } from '@/lib/company-api';
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
  Package,
  Share2,
  Check
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { getStoredUser, hasRoleAccess } from '@/lib/auth';
import { StartChatButton } from '@/components/chat/start-chat-button';
import { ShipmentCard, ShipmentCardData } from '@/components/shipment-card';
import { isShipmentAvailable } from '@/lib/utils';

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
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchCompanyProfile = useCallback(async () => {
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
  }, [companySlug]);

  const fetchReviews = useCallback(async (resetOffset = true) => {
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
        setReviews((prevReviews) => [...prevReviews, ...response.data]);
      }
      setPagination(response.pagination);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [companySlug, pagination.limit, pagination.offset]);

  const fetchShipments = useCallback(async (resetOffset = true) => {
    setShipmentsLoading(true);
    try {
      const currentOffset = resetOffset ? 0 : shipmentsPagination.offset + shipmentsPagination.limit;
      const params = {
        limit: shipmentsPagination.limit,
        offset: currentOffset,
      };
      const response = await publicApi.getCompanyShipments(companySlug, params);
      
      // Handle different response formats
      let shipmentsData: ShipmentCardData[] = [];
      let paginationData = shipmentsPagination;
      
      // API response structure: { status: "success", data: [...], pagination: {...} }
      if (response.status === 'success' && response.data && Array.isArray(response.data)) {
        shipmentsData = response.data;
        paginationData = response.pagination || paginationData;
      } else if (response.data && Array.isArray(response.data)) {
        shipmentsData = response.data;
        paginationData = response.pagination || paginationData;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        shipmentsData = response.data.data;
        paginationData = response.data.pagination || response.pagination || paginationData;
      } else if (Array.isArray(response)) {
        shipmentsData = response;
      }
      
      // Filter only available shipments
      const availableShipments = shipmentsData.filter((shipment: any) =>
        isShipmentAvailable({
          cutoffTimeForReceivingItems: shipment.cutoffTimeForReceivingItems || shipment.departureTime,
          departureTime: shipment.departureTime,
        })
      );
      
      if (resetOffset) {
        setShipments(availableShipments);
        // Reset pagination when starting fresh
        setShipmentsPagination({
          limit: paginationData.limit || shipmentsPagination.limit,
          offset: 0,
          total: paginationData.total || 0,
          hasMore: paginationData.hasMore !== undefined ? paginationData.hasMore : (availableShipments.length >= shipmentsPagination.limit),
        });
      } else {
        setShipments((prevShipments) => [...prevShipments, ...availableShipments]);
        // Update pagination with new offset
        setShipmentsPagination({
          limit: paginationData.limit || shipmentsPagination.limit,
          offset: currentOffset,
          total: paginationData.total || shipmentsPagination.total,
          hasMore: paginationData.hasMore !== undefined ? paginationData.hasMore : (availableShipments.length >= shipmentsPagination.limit),
        });
      }
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
    } finally {
      setShipmentsLoading(false);
    }
  }, [companySlug, shipmentsPagination]);

  useEffect(() => {
    // Check if current user owns this company
    const user = getStoredUser();
    if (user && hasRoleAccess(user.role, ['COMPANY_ADMIN', 'COMPANY_STAFF'])) {
      setIsCompanyOwner(user.company?.slug === companySlug || user.company?.id === companySlug);
    }

    fetchCompanyProfile();
    fetchReviews();
    fetchShipments();
  }, [companySlug, fetchCompanyProfile, fetchReviews, fetchShipments]);

  const loadMoreReviews = () => {
    fetchReviews(false);
  };

  const loadMoreShipments = () => {
    fetchShipments(false);
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
    } catch (err) {
      console.error('Failed to submit reply:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleShareProfile = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${company?.name} - Company Profile`,
      text: `Check out ${company?.name} on Parcsal`,
      url: url,
    };

    try {
      // Try Web Share API first (mobile-friendly)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch (err) {
      // If share is cancelled or fails, fallback to clipboard
      if (err instanceof Error && err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          setCopiedUrl(true);
          setTimeout(() => setCopiedUrl(false), 2000);
        } catch (clipboardErr) {
          console.error('Failed to copy URL:', clipboardErr);
        }
      }
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
        <main className="flex-1 pt-16 md:pt-20 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-orange-600" />
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
        <main className="flex-1 pt-16 md:pt-20 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="text-center py-8 sm:py-12 px-4">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600 mb-2">Company not found</p>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">
                  {error || 'The company profile you are looking for does not exist.'}
                </p>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto">
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
      <main className="flex-1 pt-16 md:pt-20 container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Back Button */}
          <Link href="/companies/browse">
            <Button variant="ghost" size="sm" className="mb-2 sm:mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          {/* Company Header */}
          <Card className="shadow-sm">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Logo */}
                {company.logoUrl && (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 border mx-auto sm:mx-0">
                    <Image
                      src={company.logoUrl}
                      alt={`${company.name} logo`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, 96px"
                    />
                  </div>
                )}

                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  {/* Title and Badges - Mobile Stacked */}
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4 mb-4">
                    <div className="text-center sm:text-left">
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">{company.name}</h1>
                      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap">
                        {company.isVerified && (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Verified
                          </Badge>
                        )}
                        {company.rating !== null && company.rating !== undefined && (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {company.rating.toFixed(1)}
                            <span className="text-gray-500 ml-1">
                              ({company.reviewCount})
                            </span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Full width on mobile */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareProfile}
                      className="w-full sm:w-auto h-10"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </>
                      )}
                    </Button>
                    {(() => {
                      const user = getStoredUser();
                      const isCustomer = user && hasRoleAccess(user.role, ['CUSTOMER']);
                      return !isCompanyOwner && isCustomer && (
                        <div className="w-full sm:w-auto">
                          <StartChatButton
                            companyId={company.id}
                            variant="default"
                            size="default"
                          />
                        </div>
                      );
                    })()}
                    {isCompanyOwner && (
                      <Link href="/company/settings" className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full h-10">
                          Edit Profile
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Description */}
                  {company.description && (
                    <p className="text-sm sm:text-base text-gray-600 mb-4 text-center sm:text-left">{company.description}</p>
                  )}

                  {/* Details */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{company.city}, {company.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Tabs defaultValue="reviews" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto">
                  <TabsTrigger value="reviews" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2">
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Reviews</span>
                    <span className="xs:hidden">Reviews</span>
                    {company.reviewCount > 0 && (
                      <span className="text-[10px] sm:text-xs text-gray-500">({company.reviewCount})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="slots" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2">
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Live Slots</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Reviews Tab */}
                <TabsContent value="reviews" className="mt-4 sm:mt-6">
                  <div className="space-y-4">
                    {company.rating !== null && company.rating !== undefined && (
                      <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Average Rating</p>
                        <div className="flex items-center gap-2">
                          {renderStars(Math.round(company.rating))}
                          <span className="text-base sm:text-lg font-semibold">{company.rating.toFixed(1)}</span>
                          <span className="text-xs sm:text-sm text-gray-500">out of 5</span>
                        </div>
                      </div>
                    )}
                    
                    {reviewsLoading && reviews.length === 0 ? (
                      <div className="flex items-center justify-center py-8 sm:py-12">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-orange-600" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 text-gray-500">
                        <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                        <p className="text-sm sm:text-base">No reviews yet</p>
                        <p className="text-xs sm:text-sm mt-1">Be the first to review this company!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                  <p className="font-medium text-sm sm:text-base">{review.customer.fullName}</p>
                                  <span className="text-xs sm:text-sm text-gray-500">
                                    {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-gray-600 mt-2 text-xs sm:text-sm leading-relaxed">{review.comment}</p>
                            )}
                            {review.booking?.shipmentSlot && (
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-2">
                                Route: {review.booking.shipmentSlot.originCity} → {review.booking.shipmentSlot.destinationCity}
                              </p>
                            )}
                            
                            {/* Company Reply Section */}
                            {review.companyReply && (
                              <div className="mt-3 pl-3 sm:pl-4 border-l-2 border-orange-200 bg-orange-50 rounded p-2.5 sm:p-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1.5">
                                  <p className="font-medium text-xs sm:text-sm text-orange-900">Company Response</p>
                                  <span className="text-[10px] sm:text-xs text-orange-600">
                                    {format(new Date(review.updatedAt), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">{review.companyReply}</p>
                              </div>
                            )}
                            
                            {/* Reply Button (for company owners) */}
                            {isCompanyOwner && (
                              <div className="mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openReplyDialog(review)}
                                  className="text-xs w-full sm:w-auto"
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
                              className="w-full sm:w-auto"
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
                  </div>
                </TabsContent>
                
                {/* Live Slots Tab */}
                <TabsContent value="slots" className="mt-4 sm:mt-6">
                  {shipmentsLoading && shipments.length === 0 ? (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-orange-600" />
                    </div>
                  ) : shipments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500">
                      <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                      <p className="text-sm sm:text-base">No live slots available</p>
                      <p className="text-xs sm:text-sm mt-1">Check back later for available shipment slots.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {shipments.map((shipment) => (
                          <ShipmentCard key={shipment.id} shipment={shipment} />
                        ))}
                      </div>
                      
                      {shipmentsPagination.hasMore && (
                        <div className="mt-6 text-center">
                          <Button
                            variant="outline"
                            onClick={loadMoreShipments}
                            disabled={shipmentsLoading}
                            className="w-full sm:w-auto"
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
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg sm:text-xl">
              {selectedReview?.companyReply ? 'Edit Reply' : 'Reply to Review'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedReview?.companyReply 
                ? 'Update your response to this customer review.'
                : 'Write a response to this customer review. Your reply will be visible to all visitors.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                  <p className="font-medium text-xs sm:text-sm">{selectedReview.customer.fullName}</p>
                  <span className="text-[10px] sm:text-xs text-gray-500">
                    {format(new Date(selectedReview.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
                {renderStars(selectedReview.rating)}
                {selectedReview.comment && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">{selectedReview.comment}</p>
                )}
              </div>
            )}
            <Textarea
              placeholder="Write your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none text-sm"
            />
            <p className="text-xs text-gray-500 text-right">
              {replyText.length}/1000 characters
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={closeReplyDialog} 
              disabled={submittingReply}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReply} 
              disabled={submittingReply || !replyText.trim()}
              className="w-full sm:w-auto order-1 sm:order-2"
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

