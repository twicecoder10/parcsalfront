'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { adminMarketingApi } from '@/lib/marketing-api';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api';
import type { CampaignChannel, AudienceType } from '@/lib/api-types';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Bell,
  MessageSquare,
  Loader2,
  Info,
  Save,
  Send,
  Calendar,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';

export default function NewAdminCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [previewRecipients, setPreviewRecipients] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [formData, setFormData] = useState({
    audienceType: 'PLATFORM_CUSTOMERS_ONLY' as AudienceType,
    channel: 'EMAIL' as CampaignChannel,
    subject: '',
    title: '',
    contentHtml: '',
    contentText: '',
    inAppBody: '',
    whatsappTemplateKey: '',
    scheduledAt: '',
  });

  const createMutation = useMutation({
    mutationFn: adminMarketingApi.createCampaign,
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaigns'] });
      toast.success('Campaign created successfully');
      router.push(`/admin/marketing/${campaign.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to create campaign');
    },
  });

  const sendMutation = useMutation({
    mutationFn: adminMarketingApi.sendCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaigns'] });
      toast.success('Campaign sent successfully');
      router.push('/admin/marketing');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to send campaign');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      adminMarketingApi.scheduleCampaign(id, { scheduledAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-campaigns'] });
      toast.success('Campaign scheduled successfully');
      router.push('/admin/marketing');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to schedule campaign');
    },
  });

  const handlePreviewRecipients = async () => {
    if (!formData.audienceType || !formData.channel) {
      toast.error('Please select audience type and channel first');
      return;
    }

    setLoadingPreview(true);
    try {
      // Create a draft campaign to preview
      const draft = await adminMarketingApi.createCampaign({
        audienceType: formData.audienceType,
        channel: formData.channel,
        subject: formData.subject || undefined,
        title: formData.title || undefined,
        contentHtml: formData.contentHtml || undefined,
        contentText: formData.contentText || undefined,
        inAppBody: formData.inAppBody || undefined,
      });
      const preview = await adminMarketingApi.previewRecipients(draft.id);
      const count = typeof preview.totalCount === 'number' ? preview.totalCount : 0;
      setPreviewRecipients(count);
      toast.success(`Preview: ${count} recipients`);
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to preview recipients');
      setPreviewRecipients(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const campaign = await createMutation.mutateAsync({
        audienceType: formData.audienceType,
        channel: formData.channel,
        subject: formData.subject || undefined,
        title: formData.title || undefined,
        contentHtml: formData.contentHtml || undefined,
        contentText: formData.contentText || undefined,
        inAppBody: formData.inAppBody || undefined,
        whatsappTemplateKey: formData.whatsappTemplateKey || undefined,
      });
      router.push(`/admin/marketing/${campaign.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSendNow = async () => {
    try {
      const campaign = await createMutation.mutateAsync({
        audienceType: formData.audienceType,
        channel: formData.channel,
        subject: formData.subject || undefined,
        title: formData.title || undefined,
        contentHtml: formData.contentHtml || undefined,
        contentText: formData.contentText || undefined,
        inAppBody: formData.inAppBody || undefined,
        whatsappTemplateKey: formData.whatsappTemplateKey || undefined,
      });
      await sendMutation.mutateAsync(campaign.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSchedule = async () => {
    if (!formData.scheduledAt) {
      toast.error('Please select a scheduled date and time');
      return;
    }

    try {
      const campaign = await createMutation.mutateAsync({
        audienceType: formData.audienceType,
        channel: formData.channel,
        subject: formData.subject || undefined,
        title: formData.title || undefined,
        contentHtml: formData.contentHtml || undefined,
        contentText: formData.contentText || undefined,
        inAppBody: formData.inAppBody || undefined,
        whatsappTemplateKey: formData.whatsappTemplateKey || undefined,
      });
      await scheduleMutation.mutateAsync({
        id: campaign.id,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.audienceType || !formData.channel) {
        toast.error('Please select audience type and channel');
        return false;
      }
    }
    if (step === 2) {
      if (formData.channel === 'EMAIL') {
        if (!formData.subject || !formData.contentHtml) {
          toast.error('Please fill in subject and content for email campaign');
          return false;
        }
      } else if (formData.channel === 'IN_APP') {
        if (!formData.title || !formData.inAppBody) {
          toast.error('Please fill in title and body for in-app campaign');
          return false;
        }
      } else if (formData.channel === 'WHATSAPP') {
        toast.info('WhatsApp campaigns are logged only (not yet implemented)');
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => Math.min(3, s + 1));
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const getAudienceLabel = (type: AudienceType) => {
    switch (type) {
      case 'PLATFORM_CUSTOMERS_ONLY':
        return 'All Customers';
      case 'PLATFORM_COMPANIES_ONLY':
        return 'All Companies';
      case 'PLATFORM_ALL_USERS':
        return 'All Users';
      case 'COMPANY_PAST_CUSTOMERS':
        return 'Past Customers';
      default:
        return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/marketing')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <p className="text-gray-600 mt-2">Step {step} of 3</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= s ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-300 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${step > s ? 'bg-orange-600' : 'bg-gray-300'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Select your audience and channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="audienceType">Audience Type</Label>
              <select
                id="audienceType"
                value={formData.audienceType}
                onChange={(e) => setFormData({ ...formData, audienceType: e.target.value as AudienceType })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="PLATFORM_CUSTOMERS_ONLY">All Customers</option>
                <option value="PLATFORM_COMPANIES_ONLY">All Companies</option>
                <option value="PLATFORM_ALL_USERS">All Users</option>
              </select>
              <p className="text-sm text-gray-500">
                Select who will receive this campaign
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <div className="grid grid-cols-3 gap-4">
                {(['EMAIL', 'IN_APP', 'WHATSAPP'] as CampaignChannel[]).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setFormData({ ...formData, channel })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.channel === channel
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {channel === 'EMAIL' && <Mail className="h-5 w-5" />}
                      {channel === 'IN_APP' && <Bell className="h-5 w-5" />}
                      {channel === 'WHATSAPP' && <MessageSquare className="h-5 w-5" />}
                      <span className="font-semibold">{channel}</span>
                    </div>
                    {channel === 'WHATSAPP' && (
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {formData.channel === 'WHATSAPP' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    WhatsApp sending is not yet implemented. Campaigns will be logged only.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Content */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Content</CardTitle>
            <CardDescription>
              {formData.channel === 'EMAIL' && 'Write your email content'}
              {formData.channel === 'IN_APP' && 'Write your notification content'}
              {formData.channel === 'WHATSAPP' && 'Configure WhatsApp template'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.channel === 'EMAIL' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject Line <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Enter email subject"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">{formData.subject.length}/500 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentHtml">
                    Content <span className="text-red-500">*</span>
                  </Label>
                  <RichTextEditor
                    value={formData.contentHtml}
                    onChange={(value) => setFormData({ ...formData, contentHtml: value })}
                    placeholder="Write your email content here... Use the toolbar to format your text with headings, bold, italic, lists, images, and more."
                    className="min-h-[300px] resize-y overflow-hidden"
                  />
                  <p className="text-xs text-gray-500">
                    Include a footer with an unsubscribe link.
                  </p>
                </div>
              </>
            )}

            {formData.channel === 'IN_APP' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter notification title"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500">{formData.title.length}/200 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inAppBody">
                    Body <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="inAppBody"
                    value={formData.inAppBody}
                    onChange={(e) => setFormData({ ...formData, inAppBody: e.target.value })}
                    placeholder="Enter notification body"
                    rows={8}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500">{formData.inAppBody.length}/1000 characters</p>
                </div>
              </>
            )}

            {formData.channel === 'WHATSAPP' && (
              <div className="space-y-2">
                <Label htmlFor="whatsappTemplateKey">WhatsApp Template Key (Optional)</Label>
                <Input
                  id="whatsappTemplateKey"
                  value={formData.whatsappTemplateKey}
                  onChange={(e) => setFormData({ ...formData, whatsappTemplateKey: e.target.value })}
                  placeholder="Enter template key"
                />
                <p className="text-xs text-gray-500">
                  WhatsApp template key (if applicable). Campaigns will be logged only.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Schedule & Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Review</CardTitle>
            <CardDescription>Preview recipients and schedule your campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="font-semibold">Audience</span>
              </div>
              <p className="text-sm text-gray-600">{getAudienceLabel(formData.audienceType)}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                {formData.channel === 'EMAIL' && <Mail className="h-5 w-5 text-gray-600" />}
                {formData.channel === 'IN_APP' && <Bell className="h-5 w-5 text-gray-600" />}
                {formData.channel === 'WHATSAPP' && <MessageSquare className="h-5 w-5 text-gray-600" />}
                <span className="font-semibold">Channel</span>
              </div>
              <p className="text-sm text-gray-600">{formData.channel}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Preview Recipients</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviewRecipients}
                  disabled={loadingPreview}
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Preview'
                  )}
                </Button>
              </div>
              {previewRecipients !== null && typeof previewRecipients === 'number' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{previewRecipients.toLocaleString()}</strong> recipients will receive this campaign
                  </p>
                  {previewRecipients === 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      No recipients found. Check your audience selection and user consent settings.
                    </p>
                  )}
                  {previewRecipients > 10000 && (
                    <p className="text-xs text-yellow-600 mt-2">
                      Warning: Recipient count exceeds admin limit (10,000). Campaign may be rejected.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule for Later (Optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-gray-500">
                Leave empty to send immediately or save as draft
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <div className="flex gap-2">
          {step === 3 && (
            <>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              {formData.scheduledAt ? (
                <Button
                  onClick={handleSchedule}
                  disabled={scheduleMutation.isPending || createMutation.isPending}
                >
                  {scheduleMutation.isPending || createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSendNow}
                  disabled={sendMutation.isPending || createMutation.isPending}
                >
                  {sendMutation.isPending || createMutation.isPending ? (
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
              )}
            </>
          )}
          {step < 3 && (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

