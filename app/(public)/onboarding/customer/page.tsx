'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OnboardingStepper } from '@/components/onboarding-stepper';
import { Progress } from '@/components/ui/progress';
import { Navbar } from '@/components/navbar';
import { 
  User, 
  MapPin, 
  Package, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Truck,
  Search
} from 'lucide-react';
import { markOnboardingComplete, getDetailedOnboardingStatus, getOnboardingStepFromStatus } from '@/lib/onboarding';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredUser, setStoredUser } from '@/lib/auth';
import { customerApi } from '@/lib/customer-api';
import { authApi } from '@/lib/api';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { AddressAutocomplete } from '@/components/address-autocomplete';

const steps = [
  { id: 'welcome', title: 'Welcome', description: 'Get started' },
  { id: 'profile', title: 'Profile', description: 'Your info' },
  { id: 'preferences', title: 'Preferences', description: 'Your needs' },
  { id: 'complete', title: 'Complete', description: 'All done!' },
];

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    address: '',
    city: '',
    country: '',
    preferredShippingMode: '',
    notificationEmail: true,
    notificationSMS: false,
  });

  // Only run queries on client-side after mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch detailed onboarding status
  const { data: onboardingStatus, refetch: refetchOnboardingStatus } = useQuery({
    queryKey: ['onboarding-status', 'user'],
    queryFn: () => getDetailedOnboardingStatus('user'),
    enabled: isMounted,
    staleTime: 30000,
  });

  // Set initial step based on detailed status if available (only on client)
  useEffect(() => {
    if (isMounted && onboardingStatus && !onboardingStatus.completed) {
      const stepFromStatus = getOnboardingStepFromStatus(onboardingStatus);
      if (stepFromStatus > 0 && stepFromStatus < steps.length) {
        setCurrentStep(stepFromStatus);
      }
    }
  }, [onboardingStatus, isMounted]);

  // Check if profile is complete and first booking is needed
  const isProfileComplete = onboardingStatus?.steps?.profile_completion?.completed === true;
  const isFirstBookingComplete = onboardingStatus?.steps?.first_booking?.completed === true;

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Clean up the data: remove empty strings for optional fields
      const cleanedData = {
        phoneNumber: data.phoneNumber,
        city: data.city,
        ...(data.address && data.address.trim() ? { address: data.address.trim() } : {}),
        ...(data.country && data.country.trim() ? { country: data.country.trim() } : {}),
        ...(data.preferredShippingMode && data.preferredShippingMode.trim() 
          ? { preferredShippingMode: data.preferredShippingMode } 
          : {}),
        notificationEmail: data.notificationEmail,
        notificationSMS: data.notificationSMS,
      };
      return await customerApi.completeOnboarding(cleanedData);
    },
    onSuccess: async () => {
      // Refresh onboarding status and user data
      await Promise.all([
        refetchOnboardingStatus(),
        queryClient.invalidateQueries({ queryKey: ['onboarding-status'] }),
      ]);
      
      // Refresh user data to get updated onboarding status
      try {
        const updatedUser = await authApi.getCurrentUser();
        setStoredUser(updatedUser);
      } catch (error) {
        console.warn('Failed to refresh user data:', error);
      }
      
      setCurrentStep(3); // Go to complete step
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save onboarding data. Please try again.';
      setError(errorMessage);
    },
  });

  const handleNext = () => {
    setError('');
    if (currentStep < steps.length - 1) {
      if (currentStep === 2) {
        // Submit onboarding data on preferences step
        updateProfileMutation.mutate(formData);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    router.push('/customer/dashboard');
  };

  // Use detailed progress if available, otherwise calculate from current step
  // Only use detailed progress after mount to avoid hydration mismatch
  const progress = isMounted && onboardingStatus?.progress 
    ? onboardingStatus.progress 
    : ((currentStep + 1) / steps.length) * 100;

  // If profile is complete but first booking is not, show guidance
  if (isProfileComplete && !isFirstBookingComplete && currentStep !== 3) {
    return (
      <GoogleMapsLoader>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
          <Navbar />
          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                      <div className="rounded-full bg-green-100 p-6">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Profile Complete! 🎉
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                      Great! Now let&apos;s find and book your first shipment.
                    </p>
                  </div>

                  <div className="mb-8">
                    <OnboardingChecklist status={onboardingStatus} type="customer" />
                  </div>

                  <div className="flex justify-center gap-4">
                    <Link href="/customer/shipments/browse">
                      <Button className="bg-orange-600 hover:bg-orange-700 h-12 px-8">
                        Browse Shipments
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/customer/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </GoogleMapsLoader>
    );
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stepper */}
          <div className="mb-12">
            <OnboardingStepper steps={steps} currentStep={currentStep} />
          </div>

          {/* Step Content */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              {error && currentStep < 3 && (
                <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              {currentStep === 0 && <WelcomeStep />}
              {currentStep === 1 && (
                <ProfileStep
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {currentStep === 2 && (
                <PreferencesStep
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {currentStep === 3 && <CompleteStep user={user} />}

              {/* Navigation Buttons */}
              {currentStep < 3 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <div>
                    {currentStep > 0 && (
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await markOnboardingComplete();
                          router.push('/customer/dashboard');
                        }}
                        className="text-gray-600"
                      >
                        Skip for now
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleBack}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                    )}
                    <Button
                      onClick={handleNext}
                      disabled={
                        updateProfileMutation.isPending ||
                        (currentStep === 1 && (!formData.phoneNumber || !formData.city))
                      }
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {updateProfileMutation.isPending
                        ? 'Saving...'
                        : currentStep === 2
                        ? 'Complete Setup'
                        : 'Continue'}
                      {!updateProfileMutation.isPending && (
                        <ArrowRight className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <>
                  <div className="mb-8">
                    <OnboardingChecklist status={onboardingStatus || null} type="customer" />
                  </div>
                <div className="mt-8 pt-6 border-t">
                  <Button
                    onClick={handleComplete}
                    className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </GoogleMapsLoader>
  );
}

// Welcome Step
function WelcomeStep() {
  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-orange-100 p-6">
          <Sparkles className="h-12 w-12 text-orange-600" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Parcsal! 🎉
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        We&apos;re excited to have you here. Let&apos;s set up your account in just a few quick steps 
        so you can start finding and booking shipment slots.
      </p>
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-blue-100 p-4 mb-4">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-2">Search Shipments</h3>
          <p className="text-sm text-gray-600 text-center">
            Find available slots by route and date
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-green-100 p-4 mb-4">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-semibold mb-2">Book Instantly</h3>
          <p className="text-sm text-gray-600 text-center">
            Secure booking with transparent pricing
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-purple-100 p-4 mb-4">
            <Truck className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-2">Track Delivery</h3>
          <p className="text-sm text-gray-600 text-center">
            Real-time updates on your shipments
          </p>
        </div>
      </div>
    </div>
  );
}

// Profile Step
interface ProfileStepProps {
  formData: {
    phoneNumber: string;
    address: string;
    city: string;
    country: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

function ProfileStep({ formData, setFormData }: ProfileStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-orange-100 p-4">
            <User className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Your Profile
        </h2>
        <p className="text-gray-600">
          Help us personalize your experience
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-sm font-medium">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="h-11"
            required
          />
        </div>

        <AddressAutocomplete
          value={formData.address}
          onChange={(value) => setFormData({ ...formData, address: value })}
          label="Street Address"
          placeholder="123 Main Street"
          country={formData.country}
        />

        <div className="grid md:grid-cols-2 gap-4">
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
            required
            placeholder="Select city"
          />
        </div>
      </div>
    </div>
  );
}

// Preferences Step
interface PreferencesStepProps {
  formData: {
    preferredShippingMode: string;
    notificationEmail: boolean;
    notificationSMS: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

function PreferencesStep({ formData, setFormData }: PreferencesStepProps) {
  const shippingModes = [
    { value: 'VAN', label: 'Van', icon: '🚐' },
    { value: 'TRUCK', label: 'Truck', icon: '🚚' },
    { value: 'AIR', label: 'Air', icon: '✈️' },
    { value: 'TRAIN', label: 'Train', icon: '🚂' },
    { value: 'SHIP', label: 'Ship', icon: '🚢' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-orange-100 p-4">
            <Package className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Your Preferences
        </h2>
        <p className="text-gray-600">
          Tell us what you need to get better recommendations
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-4 block">
            Preferred Shipping Mode <span className="text-gray-500 font-normal">(Optional)</span>
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {shippingModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setFormData({ ...formData, preferredShippingMode: mode.value })}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  ${formData.preferredShippingMode === mode.value
                    ? 'border-orange-600 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-2xl mb-2">{mode.icon}</div>
                <div className="text-sm font-medium">{mode.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <Label className="text-sm font-medium mb-4 block">
            Notification Preferences
          </Label>
          
          <label className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-all">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">Get updates about your bookings via email</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.notificationEmail}
              onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-all">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-600">Receive text alerts for important updates</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.notificationSMS}
              onChange={(e) => setFormData({ ...formData, notificationSMS: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// Complete Step
interface CompleteStepProps {
  user: any;
}

function CompleteStep({ user }: CompleteStepProps) {
  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="rounded-full bg-green-100 p-6 animate-bounce">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <div className="absolute -top-2 -right-2 rounded-full bg-orange-100 p-3">
            <Sparkles className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        You&apos;re All Set! 🎊
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        {user?.fullName || user?.name}, your account is ready. Start exploring available shipments 
        and book your first slot!
      </p>
      
      <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
        <div className="p-6 rounded-lg border-2 border-orange-100 bg-white">
          <div className="text-3xl mb-3">🔍</div>
          <h3 className="font-semibold mb-2">Browse Shipments</h3>
          <p className="text-sm text-gray-600">
            Search for available routes and dates
          </p>
        </div>
        <div className="p-6 rounded-lg border-2 border-orange-100 bg-white">
          <div className="text-3xl mb-3">📦</div>
          <h3 className="font-semibold mb-2">Make Bookings</h3>
          <p className="text-sm text-gray-600">
            Book slots with secure payments
          </p>
        </div>
        <div className="p-6 rounded-lg border-2 border-orange-100 bg-white">
          <div className="text-3xl mb-3">📱</div>
          <h3 className="font-semibold mb-2">Track Everything</h3>
          <p className="text-sm text-gray-600">
            Monitor your shipments in real-time
          </p>
        </div>
      </div>
    </div>
  );
}

