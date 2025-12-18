'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, DollarSign, Mail, Shield, Bell, Save, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { PlatformSettings } from '@/lib/admin-api';
import { toast } from '@/lib/toast';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const settingsData = await adminApi.getSettings();
        setSettings(settingsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      setError(null);
      await adminApi.updateSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-gray-600 mt-2">Platform configuration and settings</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              value={settings.platformName || ''}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail || ''}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Commission Settings</CardTitle>
          </div>
          <CardDescription>Configure platform commission rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              step="0.1"
              value={settings.commissionRate || 0}
              onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minCommission">Minimum Commission (£)</Label>
              <Input
                id="minCommission"
                type="number"
                value={settings.minCommission || 0}
                onChange={(e) => setSettings({ ...settings, minCommission: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCommission">Maximum Commission (£)</Label>
              <Input
                id="maxCommission"
                type="number"
                value={settings.maxCommission || 0}
                onChange={(e) => setSettings({ ...settings, maxCommission: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Access Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security & Access</CardTitle>
          </div>
          <CardDescription>Manage platform security and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <p className="text-sm text-gray-600">Users must verify their email before accessing the platform</p>
            </div>
            <Button
              variant={settings.requireEmailVerification ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
            >
              {settings.requireEmailVerification ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Verify Companies</Label>
              <p className="text-sm text-gray-600">Automatically verify new company registrations</p>
            </div>
            <Button
              variant={settings.autoVerifyCompanies ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, autoVerifyCompanies: !settings.autoVerifyCompanies })}
            >
              {settings.autoVerifyCompanies ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Company Registration</Label>
              <p className="text-sm text-gray-600">Enable new company account registration</p>
            </div>
            <Button
              variant={settings.allowCompanyRegistration ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, allowCompanyRegistration: !settings.allowCompanyRegistration })}
            >
              {settings.allowCompanyRegistration ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Customer Registration</Label>
              <p className="text-sm text-gray-600">Enable new customer account registration</p>
            </div>
            <Button
              variant={settings.allowCustomerRegistration ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, allowCustomerRegistration: !settings.allowCustomerRegistration })}
            >
              {settings.allowCustomerRegistration ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>System Status</CardTitle>
          </div>
          <CardDescription>Platform maintenance and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-gray-600">Put the platform in maintenance mode (only admins can access)</p>
            </div>
            <Button
              variant={settings.maintenanceMode ? 'destructive' : 'outline'}
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            >
              {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          {settings.maintenanceMode && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Maintenance mode is enabled. Regular users cannot access the platform.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

