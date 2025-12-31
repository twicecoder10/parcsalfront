'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { companyMarketingApi } from '@/lib/marketing-api';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api';
import type { CampaignChannel, CampaignStatus } from '@/lib/api-types';
import {
  Plus,
  Mail,
  Bell,
  MessageSquare,
  MoreVertical,
  Eye,
  Send,
  X,
  Loader2,
  AlertCircle,
  Filter,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function CompanyMarketingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | 'all'>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [campaignToCancel, setCampaignToCancel] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['company-marketing-campaigns', page, statusFilter, channelFilter],
    queryFn: () =>
      companyMarketingApi.getCampaigns({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        channel: channelFilter !== 'all' ? channelFilter : undefined,
      }),
    retry: 1,
  });

  const cancelMutation = useMutation({
    mutationFn: companyMarketingApi.cancelCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-marketing-campaigns'] });
      toast.success('Campaign cancelled successfully');
      setCancelDialogOpen(false);
      setCampaignToCancel(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to cancel campaign');
    },
  });

  const sendMutation = useMutation({
    mutationFn: companyMarketingApi.sendCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-marketing-campaigns'] });
      toast.success('Campaign sent successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to send campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: companyMarketingApi.deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-marketing-campaigns'] });
      toast.success('Campaign deleted successfully');
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to delete campaign');
    },
  });

  const getStatusBadgeVariant = (status: CampaignStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'outline';
      case 'SCHEDULED':
        return 'secondary';
      case 'SENDING':
        return 'default';
      case 'SENT':
        return 'default';
      case 'FAILED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'text-gray-600';
      case 'SCHEDULED':
        return 'text-blue-600';
      case 'SENDING':
        return 'text-orange-600';
      case 'SENT':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'CANCELLED':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  const getChannelIcon = (channel: CampaignChannel) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'IN_APP':
        return <Bell className="h-4 w-4" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleCancel = (campaignId: string) => {
    setCampaignToCancel(campaignId);
    setCancelDialogOpen(true);
  };

  const handleDelete = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (campaignToDelete) {
      deleteMutation.mutate(campaignToDelete);
    }
  };

  const canDeleteCampaign = (status: CampaignStatus) => {
    return ['DRAFT', 'SCHEDULED', 'CANCELLED'].includes(status);
  };

  const confirmCancel = () => {
    if (campaignToCancel) {
      cancelMutation.mutate(campaignToCancel);
    }
  };

  const handleSend = (campaignId: string) => {
    if (confirm('Are you sure you want to send this campaign immediately?')) {
      sendMutation.mutate(campaignId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{getErrorMessage(error) || 'Failed to load campaigns'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Ensure campaigns is always an array - handle different response structures
  let campaigns: any[] = [];
  let pagination = { limit: 20, offset: 0, total: 0, hasMore: false };
  
  if (data) {
    if (Array.isArray(data.data)) {
      campaigns = data.data;
      pagination = data.pagination || pagination;
    } else if (Array.isArray(data)) {
      campaigns = data;
    } else if (data.data && Array.isArray(data.data)) {
      campaigns = data.data;
      pagination = data.pagination || pagination;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Campaigns</h1>
          <p className="text-gray-600 mt-2">Create and manage campaigns for your past customers</p>
        </div>
        <Button onClick={() => router.push('/company/marketing/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Companies can only target past customers who have made bookings with your company.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
                className="px-3 py-1.5 border rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="SENDING">Sending</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Channel</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as CampaignChannel | 'all')}
                className="px-3 py-1.5 border rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first marketing campaign</p>
              <Button onClick={() => router.push('/company/marketing/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {campaign.subject || campaign.title || 'Untitled Campaign'}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(campaign.status)} className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getChannelIcon(campaign.channel)}
                        {campaign.channel}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                      <span>Recipients: {campaign.totalRecipients.toLocaleString()}</span>
                      {campaign.status === 'SENT' && (
                        <>
                          <span>•</span>
                          <span>Delivered: {campaign.deliveredCount.toLocaleString()}</span>
                          <span>•</span>
                          <span>Failed: {campaign.failedCount.toLocaleString()}</span>
                        </>
                      )}
                      {campaign.scheduledAt && (
                        <>
                          <span>•</span>
                          <span>
                            Scheduled: {format(new Date(campaign.scheduledAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </>
                      )}
                      {campaign.sentAt && (
                        <>
                          <span>•</span>
                          <span>Sent: {format(new Date(campaign.sentAt), 'MMM d, yyyy h:mm a')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/company/marketing/${campaign.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                        <>
                          <DropdownMenuItem onClick={() => handleSend(campaign.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Now
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCancel(campaign.id)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        </>
                      )}
                      {canDeleteCampaign(campaign.status) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(campaign.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
            {pagination.total} campaigns
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this campaign? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              No, Keep Campaign
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Campaign'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone. Only DRAFT, SCHEDULED, or CANCELLED campaigns can be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

