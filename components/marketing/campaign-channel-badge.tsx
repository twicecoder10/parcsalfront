import type { CampaignChannel } from '@/lib/api-types';
import { Mail, Bell, MessageSquare } from 'lucide-react';

interface CampaignChannelBadgeProps {
  channel: CampaignChannel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CampaignChannelBadge({
  channel,
  showIcon = true,
  size = 'md',
}: CampaignChannelBadgeProps) {
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

  const getChannelLabel = (channel: CampaignChannel) => {
    switch (channel) {
      case 'EMAIL':
        return 'Email';
      case 'IN_APP':
        return 'In-App';
      case 'WHATSAPP':
        return 'WhatsApp';
      default:
        return channel;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const channelColors: Record<CampaignChannel, string> = {
    EMAIL: 'bg-purple-100 text-purple-800',
    IN_APP: 'bg-blue-100 text-blue-800',
    WHATSAPP: 'bg-green-100 text-green-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${channelColors[channel]} ${sizeClasses[size]}`}
    >
      {showIcon && <span>{getChannelIcon(channel)}</span>}
      {getChannelLabel(channel)}
    </span>
  );
}

