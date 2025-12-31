'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminMarketingApi } from '@/lib/marketing-api';
import { RichTextEditor } from '@/components/rich-text-editor';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api';
import type { CampaignStatus, CampaignChannel, AudienceType } from '@/lib/api-types';
import {
  ArrowLeft,
  Send,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Bell,
  MessageSquare,
  Copy,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
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

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    audienceType: '' as AudienceType | '',
    channel: '' as CampaignChannel | '',
    subject: '',
    title: '',
    contentHtml: '',
    contentText: '',
    inAppBody: '',
    whatsappTemplateKey: '',
    scheduledAt: '',
  });

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['admin-marketing-campaign', campaignId],
    queryFn: () => adminMarketingApi.getCampaign(campaignId),
  });

  const sendMutation = useMutation({
    mutationFn: adminMarketingApi.sendCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaigns'] });
      toast.success('Campaign sent successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to send campaign');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ scheduledAt }: { scheduledAt: string }) =>
      adminMarketingApi.scheduleCampaign(campaignId, { scheduledAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaigns'] });
      toast.success('Campaign scheduled successfully');
      setScheduleDialogOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to schedule campaign');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: adminMarketingApi.cancelCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaigns'] });
      toast.success('Campaign cancelled successfully');
      setCancelDialogOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to cancel campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminMarketingApi.deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaigns'] });
      toast.success('Campaign deleted successfully');
      router.push('/admin/marketing');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to delete campaign');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminMarketingApi.updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaigns'] });
      toast.success('Campaign updated successfully');
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to update campaign');
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

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="h-5 w-5" />;
      case 'IN_APP':
        return <Bell className="h-5 w-5" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getAudienceLabel = (audienceType: string) => {
    switch (audienceType) {
      case 'PLATFORM_CUSTOMERS_ONLY':
        return 'All Customers';
      case 'PLATFORM_COMPANIES_ONLY':
        return 'All Companies';
      case 'PLATFORM_ALL_USERS':
        return 'All Users';
      case 'COMPANY_PAST_CUSTOMERS':
        return 'Past Customers';
      default:
        return audienceType;
    }
  };

  const handleSend = () => {
    if (confirm('Are you sure you want to send this campaign immediately?')) {
      sendMutation.mutate(campaignId);
    }
  };

  const handleSchedule = () => {
    if (!scheduledAt) {
      toast.error('Please select a scheduled date and time');
      return;
    }
    scheduleMutation.mutate({ scheduledAt: new Date(scheduledAt).toISOString() });
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(campaignId);
  };

  const canDeleteCampaign = (status: CampaignStatus) => {
    return ['DRAFT', 'SCHEDULED', 'CANCELLED'].includes(status);
  };

  const handleEdit = () => {
    if (!campaign) return;
    setEditFormData({
      audienceType: campaign.audienceType,
      channel: campaign.channel,
      subject: campaign.subject || '',
      title: campaign.title || '',
      contentHtml: campaign.contentHtml || '',
      contentText: campaign.contentText || '',
      inAppBody: campaign.inAppBody || '',
      whatsappTemplateKey: campaign.whatsappTemplateKey || '',
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!campaign) return;
    
    // Build update payload with only changed fields
    const updateData: any = {};
    
    if (editFormData.audienceType && editFormData.audienceType !== campaign.audienceType) {
      updateData.audienceType = editFormData.audienceType;
    }
    if (editFormData.channel && editFormData.channel !== campaign.channel) {
      updateData.channel = editFormData.channel;
    }
    if (editFormData.subject !== (campaign.subject || '')) {
      updateData.subject = editFormData.subject || null;
    }
    if (editFormData.title !== (campaign.title || '')) {
      updateData.title = editFormData.title || null;
    }
    if (editFormData.contentHtml !== (campaign.contentHtml || '')) {
      updateData.contentHtml = editFormData.contentHtml || null;
    }
    if (editFormData.contentText !== (campaign.contentText || '')) {
      updateData.contentText = editFormData.contentText || null;
    }
    if (editFormData.inAppBody !== (campaign.inAppBody || '')) {
      updateData.inAppBody = editFormData.inAppBody || null;
    }
    if (editFormData.whatsappTemplateKey !== (campaign.whatsappTemplateKey || '')) {
      updateData.whatsappTemplateKey = editFormData.whatsappTemplateKey || null;
    }
    
    // Handle scheduledAt
    const currentScheduledAt = campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '';
    if (editFormData.scheduledAt !== currentScheduledAt) {
      updateData.scheduledAt = editFormData.scheduledAt ? new Date(editFormData.scheduledAt).toISOString() : null;
    }
    
    if (Object.keys(updateData).length === 0) {
      toast.error('No changes to save');
      return;
    }
    
    updateMutation.mutate({ id: campaignId, data: updateData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{getErrorMessage(error) || 'Failed to load campaign'}</p>
          <Button onClick={() => router.push('/admin/marketing')}>Back to Campaigns</Button>
        </div>
      </div>
    );
  }

  const deliveryRate =
    campaign.totalRecipients > 0
      ? ((campaign.deliveredCount / campaign.totalRecipients) * 100).toFixed(1)
      : '0';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/marketing')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{campaign.subject || campaign.title || 'Untitled Campaign'}</h1>
            <Badge variant={getStatusBadgeVariant(campaign.status)} className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {getChannelIcon(campaign.channel)}
              {campaign.channel}
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">
            Created {format(new Date(campaign.createdAt), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold">{campaign.totalRecipients.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{campaign.deliveredCount.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{campaign.failedCount.toLocaleString()}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold">{deliveryRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Audience</p>
              <p className="font-medium">{getAudienceLabel(campaign.audienceType)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Channel</p>
              <p className="font-medium">{campaign.channel}</p>
            </div>
            {campaign.scheduledAt && (
              <div>
                <p className="text-sm text-gray-600">Scheduled For</p>
                <p className="font-medium">{format(new Date(campaign.scheduledAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            )}
            {campaign.startedAt && (
              <div>
                <p className="text-sm text-gray-600">Started At</p>
                <p className="font-medium">{format(new Date(campaign.startedAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <p className="text-sm text-gray-600">Sent At</p>
                <p className="font-medium">{format(new Date(campaign.sentAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            )}
            {campaign.failureReason && (
              <div>
                <p className="text-sm text-red-600">Failure Reason</p>
                <p className="text-sm text-red-600">{campaign.failureReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
              <>
                <Button
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  className="w-full"
                >
                  {sendMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </>
                  )}
                </Button>
                {campaign.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    onClick={() => setScheduleDialogOpen(true)}
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="w-full"
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Campaign
                    </>
                  )}
                </Button>
              </>
            )}
            {campaign?.status === 'DRAFT' && (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Campaign
              </Button>
            )}
            {campaign && canDeleteCampaign(campaign.status) && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full"
              >
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.channel === 'EMAIL' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Subject</p>
                <p className="font-medium">{campaign.subject}</p>
              </div>
              {campaign.contentHtml && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">HTML Content</p>
                  <div
                    className="border rounded-lg p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: campaign.contentHtml }}
                  />
                </div>
              )}
              {campaign.contentText && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Plain Text</p>
                  <pre className="whitespace-pre-wrap text-sm border rounded-lg p-4 bg-gray-50">
                    {campaign.contentText}
                  </pre>
                </div>
              )}
            </div>
          )}
          {campaign.channel === 'IN_APP' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Title</p>
                <p className="font-medium text-lg">{campaign.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Body</p>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="whitespace-pre-wrap">{campaign.inAppBody}</p>
                </div>
              </div>
            </div>
          )}
          {campaign.channel === 'WHATSAPP' && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Template Key</p>
              <p className="font-mono">{campaign.whatsappTemplateKey || 'N/A'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>Select when to send this campaign</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={scheduleMutation.isPending || !scheduledAt}>
              {scheduleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
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
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate(campaignId)}
              disabled={cancelMutation.isPending}
            >
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

      {/* Delete Dialog */}
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

      {/* Edit Campaign Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update campaign details. Only DRAFT campaigns can be edited.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Audience Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-audienceType">Audience Type</Label>
              <select
                id="edit-audienceType"
                value={editFormData.audienceType}
                onChange={(e) => setEditFormData({ ...editFormData, audienceType: e.target.value as AudienceType })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="PLATFORM_CUSTOMERS_ONLY">All Customers</option>
                <option value="PLATFORM_COMPANIES_ONLY">All Companies</option>
                <option value="PLATFORM_ALL_USERS">All Users</option>
              </select>
            </div>

            {/* Channel */}
            <div className="space-y-2">
              <Label htmlFor="edit-channel">Channel</Label>
              <select
                id="edit-channel"
                value={editFormData.channel}
                onChange={(e) => setEditFormData({ ...editFormData, channel: e.target.value as CampaignChannel })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>

            {/* Email Fields */}
            {editFormData.channel === 'EMAIL' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Subject *</Label>
                  <Input
                    id="edit-subject"
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                    placeholder="Email subject line"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contentHtml">Content <span className="text-red-500">*</span></Label>
                  <RichTextEditor
                    value={editFormData.contentHtml}
                    onChange={(value) => setEditFormData({ ...editFormData, contentHtml: value })}
                    placeholder="Write your email content here... Use the toolbar to format your text with headings, bold, italic, lists, images, and more."
                    className="min-h-[300px] resize-y overflow-hidden"
                  />
                </div>
              </>
            )}

            {/* In-App Fields */}
            {editFormData.channel === 'IN_APP' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    placeholder="Notification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-inAppBody">Body *</Label>
                  <Textarea
                    id="edit-inAppBody"
                    value={editFormData.inAppBody}
                    onChange={(e) => setEditFormData({ ...editFormData, inAppBody: e.target.value })}
                    rows={6}
                    placeholder="Notification body text"
                  />
                </div>
              </>
            )}

            {/* WhatsApp Fields */}
            {editFormData.channel === 'WHATSAPP' && (
              <div className="space-y-2">
                <Label htmlFor="edit-whatsappTemplateKey">WhatsApp Template Key *</Label>
                <Input
                  id="edit-whatsappTemplateKey"
                  value={editFormData.whatsappTemplateKey}
                  onChange={(e) => setEditFormData({ ...editFormData, whatsappTemplateKey: e.target.value })}
                  placeholder="WhatsApp template key"
                />
              </div>
            )}

            {/* Scheduled At */}
            <div className="space-y-2">
              <Label htmlFor="edit-scheduledAt">Schedule For (Optional)</Label>
              <Input
                id="edit-scheduledAt"
                type="datetime-local"
                value={editFormData.scheduledAt}
                onChange={(e) => setEditFormData({ ...editFormData, scheduledAt: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Leave empty to clear scheduled time. Campaign will remain in DRAFT status.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

