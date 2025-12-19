'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface StartChatButtonProps {
  companyId: string;
  bookingId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function StartChatButton({
  companyId,
  bookingId,
  variant = 'default',
  size = 'default',
  className,
}: StartChatButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleStartChat = () => {
    // Navigate to chat page with companyId and bookingId as query params
    // Chat room will be created when first message is sent
    const chatPath = pathname?.includes('/company') ? '/company/chat' : '/customer/chat';
    const params = new URLSearchParams({ companyId });
    if (bookingId) {
      params.set('bookingId', bookingId);
    }
    router.push(`${chatPath}?${params.toString()}`);
  };

  return (
    <Button
      onClick={handleStartChat}
      variant={variant}
      size={size}
      className={className}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Message
    </Button>
  );
}

