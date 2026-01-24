'use client';

import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';

const OPEN_EVENT = 'parcsal:open-cookie-preferences';

type CookiePreferencesButtonProps = Omit<ButtonProps, 'onClick' | 'children'>;

export function CookiePreferencesButton(props: CookiePreferencesButtonProps) {
  return (
    <Button
      {...props}
      onClick={() => {
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
    >
      Manage cookie preferences
    </Button>
  );
}

