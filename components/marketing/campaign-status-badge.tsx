import { CampaignStatus } from '@/lib/marketing-api';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function CampaignStatusBadge({ status, size = 'md' }: CampaignStatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  const getStatusLabel = (s: CampaignStatus) => {
    switch (s) {
      case 'DRAFT':
        return 'Draft';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'SENDING':
        return 'Sending';
      case 'SENT':
        return 'Sent';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return s;
    }
  };

  const getStatusColor = (s: CampaignStatus) => {
    switch (s) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-700';
      case 'SENDING':
        return 'bg-amber-100 text-amber-700';
      case 'SENT':
        return 'bg-green-100 text-green-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${getStatusColor(status)} ${sizeClasses[size]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

