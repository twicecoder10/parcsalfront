'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { authApi } from '@/lib/api';
import { removeStoredUser, getStoredUser as getStoredUserHelper } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { companyApi } from '@/lib/company-api';
import type { CompanyProfile, CompanySettings } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { uploadCompanyLogo, createImagePreview, MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, validateImageFile } from '@/lib/upload-api';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function CompanySettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Get user email from stored user
  const storedUser = getStoredUserHelper();
  const isCompanyStaff = storedUser?.role === 'COMPANY_STAFF';
  
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

  const [marketingSettings, setMarketingSettings] = useState({
    emailMarketingOptIn: true,
    whatsappMarketingOptIn: true,
    carrierMarketingOptIn: true,
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
        if (settingsData.marketing) {
          setMarketingSettings(settingsData.marketing);
        }
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
        marketing: marketingSettings,
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

  const handleDeleteAccount = async () => {
    // Validate email matches
    if (deleteConfirmEmail !== storedUser?.email) {
      setError('Email does not match');
      return;
    }

    // Validate password is provided
    if (!deletePassword) {
      setError('Password is required');
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await authApi.deleteAccount(deletePassword);
      // Clear user data and redirect to home
      removeStoredUser();
      router.push('/');
    } catch (error: any) {
      setError(getErrorMessage(error) || 'Failed to delete account');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
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
        <p className="text-gray-600 mt-2">
          {isCompanyStaff 
            ? 'View company information and manage your notification preferences'
            : 'Manage your company profile and information'}
        </p>
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
          {!isCompanyStaff && (
            <TabsTrigger value="delete">Delete Account</TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>
            {isCompanyStaff ? 'View company information' : 'Update your company information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
              {isCompanyStaff ? (
                // Read-only view for staff
                <div className="space-y-6">
                  {profile?.logoUrl && (
                    <div className="space-y-2">
                      <Label>Company Logo</Label>
                      <div className="relative w-24 h-24 rounded-lg border overflow-hidden">
                        <Image
                          src={profile.logoUrl}
                          alt="Company logo"
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{profile?.name || 'N/A'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="p-2 border rounded-md bg-gray-50">
                        {profile?.website ? (
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.website}
                          </a>
                        ) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <div className="p-2 border rounded-md bg-gray-50 min-h-[100px]">
                      {profile?.description || 'N/A'}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <div className="p-2 border rounded-md bg-gray-50">
                        {profile?.contactEmail ? (
                          <a href={`mailto:${profile.contactEmail}`} className="text-blue-600 hover:underline">
                            {profile.contactEmail}
                          </a>
                        ) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <div className="p-2 border rounded-md bg-gray-50">
                        {profile?.contactPhone ? (
                          <a href={`tel:${profile.contactPhone}`} className="text-blue-600 hover:underline">
                            {profile.contactPhone}
                          </a>
                        ) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {profile?.address && (
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{profile.address}</div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-4">
                    {profile?.country && (
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <div className="p-2 border rounded-md bg-gray-50">{profile.country}</div>
                      </div>
                    )}
                    {profile?.city && (
                      <div className="space-y-2">
                        <Label>City</Label>
                        <div className="p-2 border rounded-md bg-gray-50">{profile.city}</div>
                      </div>
                    )}
                    {profile?.state && (
                      <div className="space-y-2">
                        <Label>State/Province</Label>
                        <div className="p-2 border rounded-md bg-gray-50">{profile.state}</div>
                      </div>
                    )}
                  </div>

                  {profile?.postalCode && (
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <div className="p-2 border rounded-md bg-gray-50">{profile.postalCode}</div>
                    </div>
                  )}
                </div>
              ) : (
                // Editable form for admin
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
                        accept={ALLOWED_IMAGE_TYPES.join(',')}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Validate file
                          const validation = validateImageFile(file);
                          if (!validation.valid) {
                            setError(validation.error || 'Invalid image file');
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
              )}
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
              <CardDescription>
                {isCompanyStaff 
                  ? 'Manage your personal notification preferences'
                  : 'Manage how you receive notifications'}
              </CardDescription>
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

                {/* Marketing Preferences Section */}
                <div className="pt-6 border-t">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Marketing Communications</h3>
                  
                  <div className="space-y-4">
                    {/* Email Marketing */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-blue-50 border-blue-200">
                      <div>
                        <Label htmlFor="email-marketing-opt-in" className="text-base font-medium">
                          Email Marketing
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive marketing emails from Parcsal about platform updates, new features, and special offers
                        </p>
                      </div>
                      <input
                        id="email-marketing-opt-in"
                        type="checkbox"
                        checked={marketingSettings.emailMarketingOptIn}
                        onChange={(e) =>
                          setMarketingSettings({
                            ...marketingSettings,
                            emailMarketingOptIn: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </div>

                    {/* WhatsApp Marketing */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200">
                      <div>
                        <Label htmlFor="whatsapp-marketing-opt-in" className="text-base font-medium">
                          WhatsApp Marketing
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive marketing messages from Parcsal via WhatsApp about platform updates and features
                        </p>
                      </div>
                      <input
                        id="whatsapp-marketing-opt-in"
                        type="checkbox"
                        checked={marketingSettings.whatsappMarketingOptIn}
                        onChange={(e) =>
                          setMarketingSettings({
                            ...marketingSettings,
                            whatsappMarketingOptIn: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </div>

                    {/* Carrier Marketing */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-purple-50 border-purple-200">
                      <div>
                        <Label htmlFor="carrier-marketing-opt-in" className="text-base font-medium">
                          Platform Marketing
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive marketing communications from Parcsal about platform updates, features, and promotions
                        </p>
                      </div>
                      <input
                        id="carrier-marketing-opt-in"
                        type="checkbox"
                        checked={marketingSettings.carrierMarketingOptIn}
                        onChange={(e) =>
                          setMarketingSettings({
                            ...marketingSettings,
                            carrierMarketingOptIn: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </div>
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

        {!isCompanyStaff && (
          <TabsContent value="delete">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-red-900">Warning: This action cannot be undone</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                    <li>Your account will be permanently deleted</li>
                    <li>All personal information will be anonymized</li>
                    <li><strong>Your company will be permanently deleted</strong></li>
                    <li><strong>All staff members will have their accounts anonymized</strong></li>
                    <li>All company data (shipments, bookings, warehouses, subscriptions) will be deleted</li>
                    <li>You will be logged out immediately</li>
                  </ul>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setDeleteConfirmEmail('');
          setDeletePassword('');
          setError(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account, your company, and all company data.
              All staff members will also have their accounts anonymized. This cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">Warning: This is destructive and cannot be undone</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-email">
                To verify, type your email address <strong className="text-gray-700">{storedUser?.email}</strong>
              </Label>
              <Input
                id="confirm-email"
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={storedUser?.email}
                disabled={deleting}
                autoComplete="off"
              />
              {deleteConfirmEmail && deleteConfirmEmail !== storedUser?.email && (
                <p className="text-xs text-red-600">Email does not match</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-password">
                Enter your password to confirm
              </Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Password"
                disabled={deleting}
                autoComplete="current-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmEmail('');
                setDeletePassword('');
                setError(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                deleting ||
                deleteConfirmEmail !== storedUser?.email ||
                !deletePassword
              }
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </GoogleMapsLoader>
  );
}

