'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { userMarketingApi } from '@/lib/marketing-api';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Loader2, CheckCircle2, AlertCircle, Mail, MessageSquare, Building2, Info } from 'lucide-react';
export default function MarketingPreferencesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const [emailOptIn, setEmailOptIn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [carrierOptIn, setCarrierOptIn] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: consent, isLoading, error } = useQuery({
    queryKey: ['marketing-consent'],
    queryFn: () => userMarketingApi.getConsent(),
    enabled: !!user,
  });

  useEffect(() => {
    if (consent) {
      setEmailOptIn(consent.emailMarketingOptIn);
      setWhatsappOptIn(consent.whatsappMarketingOptIn);
      setCarrierOptIn(consent.carrierMarketingOptIn);
    }
  }, [consent]);

  const updateMutation = useMutation({
    mutationFn: userMarketingApi.updateConsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-consent'] });
      toast.success('Marketing preferences updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to update preferences');
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        emailMarketingOptIn: emailOptIn,
        whatsappMarketingOptIn: whatsappOptIn,
        carrierMarketingOptIn: carrierOptIn,
      });
    } catch (error) {
      // Error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (type: 'email' | 'whatsapp' | 'carrier') => {
    if (type === 'email') {
      setEmailOptIn(!emailOptIn);
    } else if (type === 'whatsapp') {
      setWhatsappOptIn(!whatsappOptIn);
    } else if (type === 'carrier') {
      setCarrierOptIn(!carrierOptIn);
    }
    // Auto-save on toggle
    setTimeout(() => {
      updateMutation.mutate({
        emailMarketingOptIn: type === 'email' ? !emailOptIn : emailOptIn,
        whatsappMarketingOptIn: type === 'whatsapp' ? !whatsappOptIn : whatsappOptIn,
        carrierMarketingOptIn: type === 'carrier' ? !carrierOptIn : carrierOptIn,
      });
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{getErrorMessage(error) || 'Failed to load preferences'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Marketing Preferences</h1>
          <p className="text-gray-600 mt-2">Control how you receive marketing communications</p>
        </div>

        {/* Info Alert */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                You can unsubscribe from marketing emails anytime by clicking the unsubscribe link in any marketing email.
                Changes to your preferences are saved automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Cards */}
        <div className="space-y-4">
          {/* Parcsal Email Marketing */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <Label htmlFor="email-opt-in" className="text-base font-semibold cursor-pointer">
                      Parcsal Email Marketing
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Receive promotional emails from Parcsal. Platform updates, offers, and announcements.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="email-opt-in"
                    checked={emailOptIn}
                    onChange={() => handleToggle('email')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Parcsal WhatsApp Marketing */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <Label htmlFor="whatsapp-opt-in" className="text-base font-semibold cursor-pointer">
                      Parcsal WhatsApp Marketing
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Receive WhatsApp messages from Parcsal. Get updates via WhatsApp (coming soon).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="whatsapp-opt-in"
                    checked={whatsappOptIn}
                    onChange={() => handleToggle('whatsapp')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Company Promotions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    <Label htmlFor="carrier-opt-in" className="text-base font-semibold cursor-pointer">
                      Company Promotions
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Receive promotional messages from shipping companies. Special offers and updates from companies
                    you&apos;ve used.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="carrier-opt-in"
                    checked={carrierOptIn}
                    onChange={() => handleToggle('carrier')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        {updateMutation.isSuccess && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800">Preferences saved successfully!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Save Button (optional, since we auto-save) */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || updateMutation.isPending}>
            {saving || updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
  );
}

