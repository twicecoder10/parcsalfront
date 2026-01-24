'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ConsentState } from '@/lib/consent';
import { getDefaultConsent } from '@/lib/consent';

type CookiePreferencesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConsent?: ConsentState | null;
  onSave: (state: ConsentState) => void;
};

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <label className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-orange-600 peer-disabled:bg-gray-100" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5 peer-disabled:bg-gray-200" />
      </label>
    </div>
  );
}

export function CookiePreferencesDialog({
  open,
  onOpenChange,
  initialConsent,
  onSave,
}: CookiePreferencesDialogProps) {
  const [consent, setConsentState] = useState<ConsentState>(getDefaultConsent());

  useEffect(() => {
    if (open) {
      setConsentState(initialConsent ?? getDefaultConsent());
    }
  }, [open, initialConsent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Manage how we use cookies to improve your experience. Necessary cookies are always enabled.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ToggleRow
            label="Necessary"
            description="Required for core site functionality and security."
            checked={true}
            disabled
          />
          <ToggleRow
            label="Analytics"
            description="Helps us understand how the site is used to improve performance."
            checked={consent.analytics}
            onChange={(checked) => setConsentState((prev) => ({ ...prev, analytics: checked }))}
          />
          <ToggleRow
            label="Marketing"
            description="Allows us to personalize marketing and communications."
            checked={consent.marketing}
            onChange={(checked) => setConsentState((prev) => ({ ...prev, marketing: checked }))}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const nextState: ConsentState = {
                necessary: true,
                analytics: consent.analytics,
                marketing: consent.marketing,
              };
              onSave(nextState);
              onOpenChange(false);
            }}
          >
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

