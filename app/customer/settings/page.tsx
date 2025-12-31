'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStoredUser } from '@/lib/auth';
import { customerApi } from '@/lib/customer-api';
import { getErrorMessage } from '@/lib/api';
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
import { removeStoredUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { AddressAutocomplete } from '@/components/address-autocomplete';

export default function SettingsPage() {
  const user = getStoredUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [emailMarketingOptIn, setEmailMarketingOptIn] = useState(true);
  const [whatsappMarketingOptIn, setWhatsappMarketingOptIn] = useState(true);
  const [carrierMarketingOptIn, setCarrierMarketingOptIn] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchNotificationPreferences();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const profile = await customerApi.getProfile();
      // setFullName(profile.fullName);
      // setEmail(profile.email);
      // setPhoneNumber(profile.phoneNumber || '');
      // setCity(profile.city || '');
      // setAddress(profile.address || '');
      // setCountry(profile.country || '');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      const prefs = await customerApi.getNotificationPreferences();
      setEmailNotifications(prefs.email);
      setSmsNotifications(prefs.sms);
      if (prefs.marketing) {
        setEmailMarketingOptIn(prefs.marketing.emailMarketingOptIn);
        setWhatsappMarketingOptIn(prefs.marketing.whatsappMarketingOptIn);
        setCarrierMarketingOptIn(prefs.marketing.carrierMarketingOptIn);
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      // Default to email enabled if fetch fails
      setEmailNotifications(true);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await customerApi.updateProfile({
        fullName,
        email,
        phoneNumber,
        city,
        address,
        country,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: getErrorMessage(error) || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await customerApi.changePassword({
        currentPassword,
        newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: getErrorMessage(error) || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await customerApi.updateNotificationPreferences({
        email: emailNotifications,
        sms: smsNotifications,
        marketing: {
          emailMarketingOptIn: emailMarketingOptIn,
          whatsappMarketingOptIn: whatsappMarketingOptIn,
          carrierMarketingOptIn: carrierMarketingOptIn,
        },
      });
      setMessage({ type: 'success', text: 'Notification preferences updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: getErrorMessage(error) || 'Failed to update notification preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Validate email matches
    if (deleteConfirmEmail !== user?.email) {
      setMessage({ type: 'error', text: 'Email does not match' });
      return;
    }

    // Validate password is provided
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Password is required' });
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      await authApi.deleteAccount(deletePassword);
      // Clear user data and redirect to home
      removeStoredUser();
      router.push('/');
    } catch (error: any) {
      setMessage({ type: 'error', text: getErrorMessage(error) || 'Failed to delete account' });
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <GoogleMapsLoader>
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-6">
      {/* Page Header */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Message Alert */}
      {message && (
        <Card className={`${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} mx-1`}>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-start gap-3">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm sm:text-base ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
        {/* Mobile-responsive tabs list with horizontal scroll */}
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="w-full min-w-max grid grid-cols-4 h-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              Password
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="delete" className="text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap">
              Delete
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-0">
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
              <CardDescription className="text-sm">Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-10 sm:h-11"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 sm:h-11"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-10 sm:h-11"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Country & City - Stacked on mobile, side-by-side on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CountrySelect
                    value={country}
                    onChange={(value) => setCountry(value)}
                    label="Country"
                    placeholder="Select country"
                  />
                  <CitySelect
                    value={city}
                    onChange={(value) => setCity(value)}
                    country={country}
                    label="City"
                    placeholder="Select city"
                  />
                </div>

                {/* Address */}
                <AddressAutocomplete
                  value={address}
                  onChange={(value) => setAddress(value)}
                  label="Address"
                  placeholder="Enter address"
                  country={country}
                />

                {/* Submit Button */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="w-full sm:w-auto min-w-[140px] h-10 sm:h-11"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        </TabsContent>

        <TabsContent value="password" className="mt-0">
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl">Change Password</CardTitle>
              <CardDescription className="text-sm">Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handlePasswordUpdate} className="space-y-4 sm:space-y-5">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="h-10 sm:h-11"
                    placeholder="Enter current password"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-10 sm:h-11"
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-10 sm:h-11"
                    placeholder="Confirm new password"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="w-full sm:w-auto min-w-[160px] h-10 sm:h-11"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl">Notification Preferences</CardTitle>
              <CardDescription className="text-sm">Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
              {/* Email Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg border bg-orange-50 border-orange-200">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="emailNotifications" className="text-sm sm:text-base font-medium cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 pr-2">
                    Receive all notifications via email. You&apos;ll get emails for booking updates, payment confirmations, shipment status changes, and more.
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:ml-4">
                  <span className="text-sm text-gray-700 sm:hidden mr-2">
                    {emailNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer flex-shrink-0"
                  />
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg border bg-gray-50">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="smsNotifications" className="text-sm sm:text-base font-medium cursor-pointer">
                    SMS Notifications
                  </Label>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 pr-2">
                    Receive updates via SMS
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:ml-4">
                  <span className="text-sm text-gray-700 sm:hidden mr-2">
                    {smsNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    id="smsNotifications"
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer flex-shrink-0"
                  />
                </div>
              </div>

              {/* Marketing Preferences Section */}
              <div className="pt-4 border-t">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Marketing Communications</h3>
                
                {/* Email Marketing */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg border bg-blue-50 border-blue-200 mb-3">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="emailMarketingOptIn" className="text-sm sm:text-base font-medium cursor-pointer">
                      Email Marketing
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 pr-2">
                      Receive marketing emails from Parcsal about promotions, new features, and special offers. Also required to receive marketing emails from companies you&apos;ve booked with.
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:ml-4">
                    <span className="text-sm text-gray-700 sm:hidden mr-2">
                      {emailMarketingOptIn ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      id="emailMarketingOptIn"
                      type="checkbox"
                      checked={emailMarketingOptIn}
                      onChange={(e) => setEmailMarketingOptIn(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer flex-shrink-0"
                    />
                  </div>
                </div>

                {/* WhatsApp Marketing */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg border bg-green-50 border-green-200 mb-3">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="whatsappMarketingOptIn" className="text-sm sm:text-base font-medium cursor-pointer">
                      WhatsApp Marketing
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 pr-2">
                      Receive marketing messages from Parcsal via WhatsApp
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:ml-4">
                    <span className="text-sm text-gray-700 sm:hidden mr-2">
                      {whatsappMarketingOptIn ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      id="whatsappMarketingOptIn"
                      type="checkbox"
                      checked={whatsappMarketingOptIn}
                      onChange={(e) => setWhatsappMarketingOptIn(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer flex-shrink-0"
                    />
                  </div>
                </div>

                {/* Carrier Marketing */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg border bg-purple-50 border-purple-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="carrierMarketingOptIn" className="text-sm sm:text-base font-medium cursor-pointer">
                      Carrier Marketing
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 pr-2">
                      Allow companies you&apos;ve booked with to send you marketing emails and in-app notifications about their services and promotions
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:ml-4">
                    <span className="text-sm text-gray-700 sm:hidden mr-2">
                      {carrierMarketingOptIn ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      id="carrierMarketingOptIn"
                      type="checkbox"
                      checked={carrierMarketingOptIn}
                      onChange={(e) => setCarrierMarketingOptIn(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer flex-shrink-0"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button 
                  onClick={handleNotificationUpdate} 
                  disabled={saving}
                  className="w-full sm:w-auto min-w-[160px] h-10 sm:h-11"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delete" className="mt-0">
          <Card className="border-red-200 border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-red-600 flex items-center gap-2 text-lg sm:text-xl">
                <Trash2 className="h-5 w-5 flex-shrink-0" />
                <span>Delete Account</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
              {/* Warning Box */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-red-900 text-sm sm:text-base">
                  Warning: This action cannot be undone
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-red-800">
                  <li>Your account will be permanently deleted</li>
                  <li>All personal information will be anonymized</li>
                  <li>Booking records will be kept for business purposes but anonymized</li>
                  <li>Reviews will remain but will be linked to an anonymized account</li>
                  <li>You will be logged out immediately</li>
                </ul>
              </div>

              {/* Delete Button */}
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full sm:w-auto h-10 sm:h-11"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setDeleteConfirmEmail('');
          setDeletePassword('');
          setMessage(null);
        }
      }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="text-red-600 text-lg sm:text-xl">Delete Account</DialogTitle>
            <DialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete your account and anonymize your data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Warning Banner */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-red-800 font-medium">
                Warning: This is destructive and cannot be undone
              </p>
            </div>
            
            {/* Email Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="confirm-email" className="text-sm">
                To verify, type your email address{' '}
                <strong className="text-gray-700 block sm:inline mt-1 sm:mt-0 break-all">
                  {user?.email}
                </strong>
              </Label>
              <Input
                id="confirm-email"
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={user?.email}
                disabled={deleting}
                autoComplete="off"
                className="h-10 sm:h-11 text-sm"
              />
              {deleteConfirmEmail && deleteConfirmEmail !== user?.email && (
                <p className="text-xs text-red-600">Email does not match</p>
              )}
            </div>

            {/* Password Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="delete-password" className="text-sm">
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
                className="h-10 sm:h-11 text-sm"
              />
            </div>
          </div>

          {/* Dialog Actions */}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmEmail('');
                setDeletePassword('');
                setMessage(null);
              }}
              disabled={deleting}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                deleting ||
                deleteConfirmEmail !== user?.email ||
                !deletePassword
              }
              className="w-full sm:w-auto order-1 sm:order-2"
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
      </div>
    </GoogleMapsLoader>
  );
}

