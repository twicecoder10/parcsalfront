'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { CompanyProfile, CompanySettings } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { uploadCompanyLogo, createImagePreview } from '@/lib/upload-api';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function CompanySettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    country: '',
    state: '',
    postalCode: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    bookingUpdates: true,
    shipmentUpdates: true,
  });

  // Staff restrictions state
  const [savingRestrictions, setSavingRestrictions] = useState(false);
  const [restrictions, setRestrictions] = useState<Record<string, boolean>>({});
  const [staffRestrictions, setStaffRestrictions] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, settingsData] = await Promise.all([
        companyApi.getCompanyProfile(),
        companyApi.getCompanySettings(),
      ]);
      
      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        description: profileData.description || '',
        website: profileData.website || '',
        contactEmail: profileData.contactEmail || '',
        contactPhone: profileData.contactPhone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        country: profileData.country || '',
        state: profileData.state || '',
        postalCode: profileData.postalCode || '',
      });
      // Reset logo preview when profile is loaded
      setLogoFile(null);
      setLogoPreview(null);
      
      setSettings(settingsData);
      if (settingsData) {
        setNotificationSettings(settingsData.notifications);
      }
      
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      setError(getErrorMessage(error) || 'Failed to load company data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const updatedProfile = await companyApi.updateCompanyProfile(formData);
      setProfile(updatedProfile);
      setSuccessMessage('Company profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setError(getErrorMessage(error) || 'Failed to update company profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const updatedSettings = await companyApi.updateCompanySettings({
        notifications: notificationSettings,
      });
      setSettings(updatedSettings);
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      setError(getErrorMessage(error) || 'Failed to update settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSubmitRestrictions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRestrictions(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // TODO: This function requires a memberId parameter. Update this when implementing staff restrictions UI.
      // const updated = await companyApi.updateStaffRestrictions(memberId, restrictions);
      // setStaffRestrictions(updated);
      setError('Staff restrictions feature is not yet implemented. A member ID is required.');
    } catch (error: any) {
      console.error('Failed to update restrictions:', error);
      setError(getErrorMessage(error) || 'Failed to update staff restrictions. Please try again.');
    } finally {
      setSavingRestrictions(false);
    }
  };

  const toggleRestriction = (action: string) => {
    setRestrictions((prev) => ({
      ...prev,
      [action]: !prev[action],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsLoader>
      <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Settings</h1>
        <p className="text-gray-600 mt-2">Manage your company profile and information</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>Update your company information</CardDescription>
        </CardHeader>
        <CardContent>
              <form onSubmit={handleSubmitProfile} className="space-y-4">
                {/* Logo Upload Section */}
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-start gap-4">
                    {(profile?.logoUrl || logoPreview) && (
                      <div className="relative w-24 h-24 rounded-lg border overflow-hidden flex-shrink-0">
                        <Image
                          src={logoPreview || profile?.logoUrl || ''}
                          alt="Company logo"
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {logoFile ? logoFile.name : profile?.logoUrl ? 'Change logo' : 'Upload logo'}
                          </span>
                        </div>
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Validate file
                          if (file.size > 10 * 1024 * 1024) {
                            setError('Logo file is too large. Maximum size is 10MB.');
                            return;
                          }
                          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                          if (!allowedTypes.includes(file.type)) {
                            setError('Logo must be a valid image format (JPEG, PNG, WebP, or GIF).');
                            return;
                          }

                          setError(null);
                          setLogoFile(file);
                          const preview = await createImagePreview(file);
                          setLogoPreview(preview);
                        }}
                      />
                      {logoFile && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!logoFile) return;

                            setUploadingLogo(true);
                            setError(null);
                            setSuccessMessage(null);

                            try {
                              // Upload logo
                              const logoUrl = await uploadCompanyLogo(logoFile);

                              // Update company profile with logo URL
                              const updatedProfile = await companyApi.updateCompanyProfile({
                                logoUrl: logoUrl,
                              });

                              setProfile(updatedProfile);
                              setLogoFile(null);
                              setLogoPreview(null);
                              setSuccessMessage('Logo updated successfully!');
                              setTimeout(() => setSuccessMessage(null), 5000);
                            } catch (error: any) {
                              console.error('Failed to upload logo:', error);
                              setError(getErrorMessage(error) || 'Failed to upload logo. Please try again.');
                            } finally {
                              setUploadingLogo(false);
                            }
                          }}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            'Upload Logo'
                          )}
                        </Button>
                      )}
                      {profile?.logoUrl && !logoFile && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setUploadingLogo(true);
                            setError(null);
                            setSuccessMessage(null);

                            try {
                              // Remove logo by setting to empty string
                              const updatedProfile = await companyApi.updateCompanyProfile({
                                logoUrl: '',
                              });

                              setProfile(updatedProfile);
                              setSuccessMessage('Logo removed successfully!');
                              setTimeout(() => setSuccessMessage(null), 5000);
                            } catch (error: any) {
                              console.error('Failed to remove logo:', error);
                              setError(getErrorMessage(error) || 'Failed to remove logo. Please try again.');
                            } finally {
                              setUploadingLogo(false);
                            }
                          }}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            'Remove Logo'
                          )}
                        </Button>
                      )}
                      <p className="text-xs text-gray-500">
                        Recommended: Square image, at least 200x200px. Max 10MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
              <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
              />
            </div>
            <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
              <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
                </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
                  <Textarea
                id="description"
                    rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your company..."
              />
            </div>

                <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
                </div>

                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => setFormData({ ...formData, address: value })}
                  label="Address"
                  placeholder="Enter address"
                  country={formData.country}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <CountrySelect
                    value={formData.country}
                    onChange={(value) => setFormData({ ...formData, country: value, city: '' })}
                    label="Country"
                    placeholder="Select country"
                  />
                  <CitySelect
                    value={formData.city}
                    onChange={(value) => setFormData({ ...formData, city: value })}
                    country={formData.country}
                    label="City"
                    placeholder="Select city"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Company Info Display */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Additional company details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Country</p>
                    <p className="font-medium">{profile.country}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {profile.isVerified ? 'Verified' : 'Pending Verification'}
                    </p>
                  </div>
                  {profile.activePlan && (
                    <div>
                      <p className="text-muted-foreground">Current Plan</p>
                      <p className="font-medium">{profile.activePlan.name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitSettings} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-orange-50 border-orange-200">
                    <div>
                      <Label htmlFor="email-notifications" className="text-base font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Receive all notifications via email. You&apos;ll get emails for new bookings, booking status changes, payment updates, shipment tracking, team invitations, and subscription changes.
                      </p>
                    </div>
                    <input
                      id="email-notifications"
                      type="checkbox"
                      checked={notificationSettings.email}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          email: e.target.checked,
                        })
                      }
                      className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <input
                      id="sms-notifications"
                      type="checkbox"
                      checked={notificationSettings.sms}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          sms: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="booking-updates">Booking Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about booking status changes
                      </p>
                    </div>
                    <input
                      id="booking-updates"
                      type="checkbox"
                      checked={notificationSettings.bookingUpdates}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          bookingUpdates: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="shipment-updates">Shipment Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about shipment status changes
                      </p>
                    </div>
                    <input
                      id="shipment-updates"
                      type="checkbox"
                      checked={notificationSettings.shipmentUpdates}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          shipmentUpdates: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={savingSettings}>
                    {savingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </Button>
                </div>
          </form>
        </CardContent>
      </Card>
        </TabsContent>

      </Tabs>
      </div>
    </GoogleMapsLoader>
  );
}

