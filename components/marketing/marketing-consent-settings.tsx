'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userMarketingApi } from '@/lib/marketing-api';
import { getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-blue-600' : 'bg-gray-200'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

export function MarketingConsentSettings() {
  const queryClient = useQueryClient();

  // Fetch current consent settings
  const { data: consent, isLoading, error } = useQuery({
    queryKey: ['marketing-consent'],
    queryFn: () => userMarketingApi.getConsent(),
  });

  // Local state for form
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [carrierOptIn, setCarrierOptIn] = useState(false);

  // Set local state when data loads
  useEffect(() => {
    if (consent) {
      setEmailOptIn(consent.emailMarketingOptIn);
      setWhatsappOptIn(consent.whatsappMarketingOptIn);
      setCarrierOptIn(consent.carrierMarketingOptIn);
    }
  }, [consent]);

  // Update consent mutation
  const updateMutation = useMutation({
    mutationFn: (data: {
      emailMarketingOptIn?: boolean;
      whatsappMarketingOptIn?: boolean;
      carrierMarketingOptIn?: boolean;
    }) => userMarketingApi.updateConsent(data),
    onSuccess: () => {
      toast.success('Marketing preferences updated successfully');
      queryClient.invalidateQueries({ queryKey: ['marketing-consent'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleToggle = (field: 'email' | 'whatsapp' | 'carrier', value: boolean) => {
    // Update local state immediately
    if (field === 'email') setEmailOptIn(value);
    if (field === 'whatsapp') setWhatsappOptIn(value);
    if (field === 'carrier') setCarrierOptIn(value);

    // Update on server
    updateMutation.mutate({
      ...(field === 'email' && { emailMarketingOptIn: value }),
      ...(field === 'whatsapp' && { whatsappMarketingOptIn: value }),
      ...(field === 'carrier' && { carrierMarketingOptIn: value }),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marketing Preferences</CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-64"></div>
                </div>
                <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marketing Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Error loading preferences: {getErrorMessage(error)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentEmailOptIn = consent?.emailMarketingOptIn ?? false;
  const currentWhatsappOptIn = consent?.whatsappMarketingOptIn ?? false;
  const currentCarrierOptIn = consent?.carrierMarketingOptIn ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketing Preferences</CardTitle>
        <CardDescription>
          Manage how you&apos;d like to receive marketing communications from Parcsal and shipping companies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ You can change these preferences anytime. You can also unsubscribe from marketing
            emails using the link in each email.
          </p>
        </div>

        {/* Email Marketing Toggle */}
        <div className="flex items-start justify-between py-4 border-b">
          <div className="flex-1 pr-4">
            <Label className="text-base font-semibold text-gray-900 cursor-pointer">
              Parcsal Email Marketing
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Receive promotional emails from Parcsal about platform updates, special offers, and announcements
            </p>
          </div>
          <Switch
            checked={currentEmailOptIn}
            onCheckedChange={(value) => handleToggle('email', value)}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* WhatsApp Marketing Toggle */}
        <div className="flex items-start justify-between py-4 border-b">
          <div className="flex-1 pr-4">
            <Label className="text-base font-semibold text-gray-900 cursor-pointer">
              Parcsal WhatsApp Marketing
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Receive WhatsApp messages from Parcsal (coming soon)
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              ⚠️ WhatsApp messaging is not yet available
            </p>
          </div>
          <Switch
            checked={currentWhatsappOptIn}
            onCheckedChange={(value) => handleToggle('whatsapp', value)}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Carrier/Company Marketing Toggle */}
        <div className="flex items-start justify-between py-4">
          <div className="flex-1 pr-4">
            <Label className="text-base font-semibold text-gray-900 cursor-pointer">
              Company Promotions
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Receive promotional messages from shipping companies you&apos;ve used, including special offers and updates
            </p>
          </div>
          <Switch
            checked={currentCarrierOptIn}
            onCheckedChange={(value) => handleToggle('carrier', value)}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">About Marketing Communications</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>You&apos;ll still receive important account and booking notifications regardless of these settings</li>
            <li>Changes take effect immediately</li>
            <li>Opting out won&apos;t affect any campaigns already being sent</li>
            <li>You can always change these preferences later</li>
          </ul>
        </div>

        {/* Last Updated */}
        {consent?.updatedAt && (
          <p className="text-xs text-gray-500 text-center">
            Last updated: {new Date(consent.updatedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

