'use client';

import type { MarketingCampaign, AudienceType } from '@/lib/api-types';
import { format } from 'date-fns';
import { CampaignStatusBadge } from './campaign-status-badge';
import { CampaignChannelBadge } from './campaign-channel-badge';
import { MoreVertical, Send, Calendar, Ban, Copy, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Link from 'next/link';

interface CampaignCardProps {
  campaign: MarketingCampaign;
  onSend?: (id: string) => void;
  onSchedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  baseUrl: string; // e.g., '/admin/marketing' or '/company/marketing'
}

export function CampaignCard({
  campaign,
  onSend,
  onSchedule,
  onCancel,
  onDelete,
  onDuplicate,
  baseUrl,
}: CampaignCardProps) {
  const getAudienceLabel = (audienceType: AudienceType) => {
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

  const formatCampaignDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  const canSend = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED';
  const canSchedule = campaign.status === 'DRAFT';
  const canCancel = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED';
  const canDelete = campaign.status === 'DRAFT';

  const title = campaign.subject || campaign.title || 'Untitled Campaign';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link href={`${baseUrl}/${campaign.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate">
                {title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <CampaignStatusBadge status={campaign.status} size="sm" />
              <CampaignChannelBadge channel={campaign.channel} size="sm" />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`${baseUrl}/${campaign.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canSend && onSend && (
                <DropdownMenuItem onClick={() => onSend(campaign.id)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </DropdownMenuItem>
              )}
              {canSchedule && onSchedule && (
                <DropdownMenuItem onClick={() => onSchedule(campaign.id)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </DropdownMenuItem>
              )}
              {canCancel && onCancel && (
                <DropdownMenuItem onClick={() => onCancel(campaign.id)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(campaign.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canDelete && onDelete && (
                <DropdownMenuItem onClick={() => onDelete(campaign.id)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Audience:</span> {getAudienceLabel(campaign.audienceType)}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Recipients:</span>
            <span className="font-semibold text-gray-900">{campaign.totalRecipients}</span>
          </div>
          {campaign.status === 'SENT' && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Delivered:</span>
              <span className="font-semibold text-green-600">
                {campaign.deliveredCount} ({Math.round((campaign.deliveredCount / campaign.totalRecipients) * 100)}%)
              </span>
            </div>
          )}
          {campaign.failedCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Failed:</span>
              <span className="font-semibold text-red-600">{campaign.failedCount}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t text-xs text-gray-500">
        <div className="flex items-center justify-between w-full">
          <span>Created {formatCampaignDate(campaign.createdAt)}</span>
          {campaign.scheduledAt && (
            <span className="text-blue-600 font-medium">
              Scheduled for {formatCampaignDate(campaign.scheduledAt)}
            </span>
          )}
          {campaign.sentAt && (
            <span className="text-green-600 font-medium">
              Sent {formatCampaignDate(campaign.sentAt)}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

