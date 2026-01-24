'use client';

import { Button } from '@/components/ui/button';

const OPEN_EVENT = 'parcsal:open-cookie-preferences';

export function CookiePreferencesLink() {
  return (
    <Button
      variant="ghost"
      className="h-auto p-0 text-sm text-gray-600 hover:text-gray-900"
      onClick={() => {
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
    >
      Manage cookie preferences
    </Button>
  );
}

