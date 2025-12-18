'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Navbar } from '@/components/navbar';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import {
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Truck,
  Globe,
  Phone,
  CreditCard,
  Loader2,
  Mail,
  AlertCircle,
  Circle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredUser, setStoredUser } from '@/lib/auth';
import { getDetailedOnboardingStatus } from '@/lib/onboarding';
import { companyApi } from '@/lib/company-api';
import { authApi } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { AddressAutocomplete } from '@/components/address-autocomplete';

/**
 * Company Onboarding Flow - Updated Implementation
 * 
 * 4 Required Steps:
 * 1. Email Verification (user-level)
 * 2. Company Profile (company-level) - auto-marks profile_completion (user-level)
 * 3. Payment Setup (company-level, automatic)
 * 4. Complete ✅
 * 
 * Optional Step:
 * - First Shipment (doesn't block completion)
 */
export default function CompanyOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Check if user is COMPANY_STAFF (invited team member)
  const isStaff = user?.role === 'COMPANY_STAFF';
  const [formData, setFormData] = useState({
    companyDescription: '',
    companyWebsite: '',
    companyLogoUrl: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch both user and company onboarding status
  const { data: userOnboardingStatus, refetch: refetchUserStatus } = useQuery({
    queryKey: ['onboarding-status', 'user'],
    queryFn: () => getDetailedOnboardingStatus('user'),
    enabled: isMounted,
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  const { data: companyOnboardingStatus, refetch: refetchCompanyStatus } = useQuery({
    queryKey: ['onboarding-status', 'company'],
    queryFn: () => getDetailedOnboardingStatus('company'),
    enabled: isMounted,
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.completed) {
        return false;
      }
      return 3000;
    },
    refetchOnWindowFocus: true,
  });

  // Step tracking - following the updated 4-step flow
  const isEmailVerified = userOnboardingStatus?.steps?.email_verification?.completed === true;
  const isProfileComplete = userOnboardingStatus?.steps?.profile_completion?.completed === true;
  const isCompanyProfileComplete = companyOnboardingStatus?.steps?.company_profile?.completed === true;
  const isPaymentSetupComplete = companyOnboardingStatus?.steps?.payment_setup?.completed === true;
  const isFirstShipmentComplete = companyOnboardingStatus?.steps?.first_shipment_slot?.completed === true;
  // For company staff, they only need to complete user steps (email verification and profile)
  // Company profile and payment are handled by company admins
  const isAllComplete = user?.onboardingCompleted === true ||
    (isEmailVerified && isProfileComplete && (
      isStaff 
        ? true // Staff only need user steps
        : (isCompanyProfileComplete && isPaymentSetupComplete) // Admins need company steps too
    ));

  // Calculate current step (1-4) based on the updated guide
  // For staff, skip company profile step
  const getCurrentStep = (): number => {
    if (!isEmailVerified) return 1; // Step 1: Email Verification
    if (isStaff) {
      // Staff don't need company profile, so after email verification they're done
      return isProfileComplete ? 4 : 2; // Step 2 would be profile completion (automatic)
    }
    if (!isCompanyProfileComplete) return 2; // Step 2: Company Profile (admins only)
    if (!isPaymentSetupComplete) return 3; // Step 3: Payment Setup
    return 4; // Step 4: Complete
  };

  const currentStep = getCurrentStep();

  // Calculate overall progress
  // For staff: only count user steps (email verification)
  // For admins: count email, company profile, and payment
  const calculateOverallProgress = (): number => {
    if (isStaff) {
      // Staff only need email verification (profile completion is automatic)
      return isEmailVerified ? 100 : Math.round((isEmailVerified ? 1 : 0) * 100);
    }
    // Admins need email, company profile, and payment
    let completed = 0;
    if (isEmailVerified) completed++;
    if (isCompanyProfileComplete) completed++;
    if (isPaymentSetupComplete) completed++;
    return Math.round((completed / 3) * 100);
  };

  const overallProgress = calculateOverallProgress();

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const cleanedData = {
        contactPhone: data.contactPhone.trim(),
        contactEmail: data.contactEmail.trim(),
        companyDescription: data.companyDescription.trim() || '',
        companyWebsite: data.companyWebsite.trim() || '',
        companyLogoUrl: data.companyLogoUrl.trim() || '',
        address: data.address.trim() || '',
        city: data.city.trim() || '',
        state: data.state.trim() || '',
        postalCode: data.postalCode.trim() || '',
      };
      return await companyApi.completeOnboarding(cleanedData);
    },
    onSuccess: async () => {
      await Promise.all([
        refetchUserStatus(),
        refetchCompanyStatus(),
        queryClient.invalidateQueries({ queryKey: ['onboarding-status'] }),
      ]);

      try {
        const updatedUser = await authApi.getCurrentUser();
        setStoredUser(updatedUser);
      } catch (error) {
        console.warn('Failed to refresh user data:', error);
      }

      setError('');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save onboarding data. Please try again.';
      setError(errorMessage);
    },
  });

  const handleAddressSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.address_components) return;

    // Extract address components
    let city = '';
    let state = '';
    let province = '';
    let postalCode = '';

    place.address_components.forEach((component) => {
      const types = component.types;

      // City (locality)
      if (types.includes('locality')) {
        city = component.long_name;
      }
      // State/Province (administrative_area_level_1) - e.g., California, Ontario
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      // Province/County (administrative_area_level_2) - e.g., Los Angeles County
      if (types.includes('administrative_area_level_2')) {
        province = component.long_name;
      }
      // Postal code
      if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    });

    // Update form data with extracted information
    // Use state if available, otherwise fall back to province
    setFormData((prev) => ({
      ...prev,
      address: place.formatted_address || prev.address,
      city: city || prev.city,
      state: state || province || prev.state,
      postalCode: postalCode || prev.postalCode,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.contactPhone.trim()) {
      setError('Contact phone is required (minimum 1 character)');
      return;
    }
    if (!formData.contactEmail.trim()) {
      setError('Contact email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.companyWebsite && formData.companyWebsite.trim()) {
      try {
        new URL(formData.companyWebsite);
      } catch {
        setError('Please enter a valid website URL or leave it empty');
        return;
      }
    }

    if (formData.companyLogoUrl && formData.companyLogoUrl.trim()) {
      try {
        new URL(formData.companyLogoUrl);
      } catch {
        setError('Please enter a valid logo URL or leave it empty');
        return;
      }
    }

    updateCompanyMutation.mutate(formData);
  };

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

  // For COMPANY_STAFF: They complete onboarding after email verification and profile completion
  // They don't see company profile section (that's for admins only)
  // They will be handled by the normal flow, but will skip company profile step
  // Company profile is handled by admins only

  // STEP 1: Email Verification Required
  if (!isEmailVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-4xl">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-orange-100 p-6">
                      <Mail className="h-12 w-12 text-orange-600" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Step 1: Verify Your Email
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    Please verify your email address before completing your company profile.
                  </p>
                  <div className="text-sm text-gray-500 mb-6">
                    Step 1 of 3 - {overallProgress}% Complete
                  </div>
                  <Progress value={overallProgress} className="h-2 max-w-md mx-auto" />
                </div>

                <div className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Onboarding Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <OnboardingChecklist 
                        userStatus={userOnboardingStatus || null} 
                        companyStatus={companyOnboardingStatus || null}
                        type="company" 
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center gap-4">
                  <Link href="/auth/verify-email">
                    <Button className="bg-orange-600 hover:bg-orange-700 h-12 px-8">
                      Verify Email
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // For staff who have verified email but profile is not yet complete, show a waiting state
  // This needs to be checked before other steps to ensure staff always see something
  if (isStaff && isEmailVerified && !isProfileComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-4xl">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-blue-100 p-6">
                      <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Completing Your Profile
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    Your email has been verified. We&apos;re setting up your profile. This should only take a moment...
                  </p>
                  <div className="text-sm text-gray-500 mb-6">
                    Step 2 of 2 - {overallProgress}% Complete
                  </div>
                  <Progress value={overallProgress} className="h-2 max-w-md mx-auto" />
                </div>

                <div className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Onboarding Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <OnboardingChecklist 
                        userStatus={userOnboardingStatus || null} 
                        companyStatus={companyOnboardingStatus || null}
                        type="company" 
                      />
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: After Company Profile - Guide to Payment Setup
  // Staff should never see this - only admins can set up payment
  if (!isStaff && isCompanyProfileComplete && !isPaymentSetupComplete) {
    return (
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
                    Company Profile Complete! 🎉
                  </h2>
                  <p className="text-lg text-gray-600 mb-2">
                    Your company profile is set up. Now set up payment to complete onboarding.
                  </p>
                  {userOnboardingStatus?.completed && (
                    <p className="text-sm text-green-600 font-medium mb-2">
                      ✓ User steps complete (100%)
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-4">
                    Company steps: {companyOnboardingStatus?.progress || 0}% complete
                  </p>
                  <div className="text-sm text-gray-500 mb-6">
                    Step 3 of 3 - {overallProgress}% Overall Complete
                  </div>
                  <Progress value={overallProgress} className="h-2 max-w-md mx-auto" />
                </div>

                <div className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Onboarding Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <OnboardingChecklist 
                        userStatus={userOnboardingStatus || null} 
                        companyStatus={companyOnboardingStatus || null}
                        type="company" 
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center gap-4">
                  <Link href="/onboarding/company/payment">
                    <Button className="bg-orange-600 hover:bg-orange-700 h-12 px-8">
                      Set Up Payment
                      <CreditCard className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/company/overview')}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: All Complete
  // For staff, this means they've completed their user steps
  // For admins, this means they've completed all company steps too
  if (isAllComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-4xl">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
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
                    🎉 Onboarding Complete!
                  </h2>
                  <p className="text-lg text-gray-600 mb-2">
                    You&apos;re all set! Your company is ready to accept bookings and start growing.
                  </p>
                  {!isFirstShipmentComplete && (
                    <p className="text-sm text-gray-500 mb-4">
                      💡 Tip: You can create your first shipment slot anytime from your dashboard.
                    </p>
                  )}
                  <div className="text-sm text-gray-500 mb-6">
                    All 3 steps completed - 100% Complete
                  </div>
                  <Progress value={100} className="h-2 max-w-md mx-auto" />
                </div>

                <div className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Completed Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* User Steps Section */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            User Steps
                          </h3>
                          {userOnboardingStatus?.steps?.email_verification?.completed && (
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900">Email Verification</p>
                                <p className="text-xs text-gray-500 mt-0.5">Verify your email address</p>
                                {userOnboardingStatus.steps.email_verification.completedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Completed {new Date(userOnboardingStatus.steps.email_verification.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {userOnboardingStatus?.steps?.profile_completion?.completed && (
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900">Profile Completion</p>
                                <p className="text-xs text-gray-500 mt-0.5">Complete your profile</p>
                                {userOnboardingStatus.steps.profile_completion.completedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Completed {new Date(userOnboardingStatus.steps.profile_completion.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Company Steps Section */}
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Company Steps
                          </h3>
                          {companyOnboardingStatus?.steps?.company_profile?.completed && (
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900">Company Profile</p>
                                <p className="text-xs text-gray-500 mt-0.5">Complete company information</p>
                                {companyOnboardingStatus.steps.company_profile.completedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Completed {new Date(companyOnboardingStatus.steps.company_profile.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {companyOnboardingStatus?.steps?.payment_setup?.completed && (
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900">Payment Setup</p>
                                <p className="text-xs text-gray-500 mt-0.5">Set up payment/subscription</p>
                                {companyOnboardingStatus.steps.payment_setup.completedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Completed {new Date(companyOnboardingStatus.steps.payment_setup.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {!isFirstShipmentComplete && (
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200">
                              <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-600">First Shipment</p>
                                <p className="text-xs text-gray-500 mt-0.5">Create your first shipment slot (optional)</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Overall Progress */}
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                            <span className="text-sm font-semibold text-orange-600">100%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-600 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => router.push('/company/overview')}
                    className="bg-orange-600 hover:bg-orange-700 h-12 px-8 text-lg"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  {!isFirstShipmentComplete && (
                    <Link href="/company/shipments/new">
                      <Button variant="outline" className="h-12 px-8">
                        Create First Shipment
                        <Truck className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Company Profile Form (only shown if email is verified and user is NOT staff)
  // Company staff skip this step entirely - they don't need to complete company profile
  
  // Only show company profile form to non-staff users (admins)
  if (!isStaff) {
    return (
      <GoogleMapsLoader>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-5xl">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep} of 3 - Company Profile Setup
                </span>
                <span className="text-sm text-gray-500">{overallProgress}% Complete</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Onboarding Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OnboardingChecklist
                      userStatus={userOnboardingStatus || null}
                      companyStatus={companyOnboardingStatus || null}
                      type="company"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-full bg-orange-100 p-3">
                        <Building2 className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Company Profile</CardTitle>
                        <CardDescription>
                          Complete your company information (Step 2 of 3)
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                          {error}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="companyDescription" className="text-sm font-medium">
                          Company Description
                        </Label>
                        <Textarea
                          id="companyDescription"
                          placeholder="Describe your company, services, and what makes you unique..."
                          value={formData.companyDescription}
                          onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                          className="min-h-[100px]"
                          rows={4}
                        />
                        <p className="text-xs text-gray-500">
                          This will be visible to customers when they view your shipments
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyWebsite" className="text-sm font-medium">
                          Website
                        </Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="companyWebsite"
                            type="url"
                            placeholder="https://yourcompany.com (optional)"
                            value={formData.companyWebsite}
                            onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyLogoUrl" className="text-sm font-medium">
                          Logo URL
                        </Label>
                        <Input
                          id="companyLogoUrl"
                          type="url"
                          placeholder="https://yourcompany.com/logo.png (optional)"
                          value={formData.companyLogoUrl}
                          onChange={(e) => setFormData({ ...formData, companyLogoUrl: e.target.value })}
                          className="h-11"
                        />
                        <p className="text-xs text-gray-500">
                          Provide a direct link to your company logo image
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="text-sm font-medium">
                          Contact Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="contactEmail"
                            type="email"
                            placeholder="contact@company.com"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className="pl-10 h-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="text-sm font-medium">
                          Contact Phone <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="contactPhone"
                            type="tel"
                            placeholder="+447340515936"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            className="pl-10 h-11"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Include country code (e.g., +44 for UK, +1 for US)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <AddressAutocomplete
                          value={formData.address}
                          onChange={(value) => setFormData({ ...formData, address: value })}
                          onPlaceSelect={handleAddressSelect}
                          label="Street Address"
                          placeholder="123 Business Street"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium">
                            City
                          </Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="Birmingham"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm font-medium">
                            State/Province
                          </Label>
                          <Input
                            id="state"
                            type="text"
                            placeholder="West Midlands"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postalCode" className="text-sm font-medium">
                            Postal Code
                          </Label>
                          <Input
                            id="postalCode"
                            type="text"
                            placeholder="B1 1AA"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => router.push('/company/overview')}
                          className="text-gray-600"
                        >
                          Skip for now
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateCompanyMutation.isPending || !formData.contactPhone.trim() || !formData.contactEmail.trim()}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {updateCompanyMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              Save & Continue
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      </GoogleMapsLoader>
    );
  }

  // Fallback: If we reach here, something unexpected happened
  // For staff, show a message; for admins, this shouldn't happen
  if (isStaff) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-4xl">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-orange-100 p-6">
                      <AlertCircle className="h-12 w-12 text-orange-600" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Setting Up Your Account
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    Please wait while we complete your profile setup. This page will refresh automatically.
                  </p>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-orange-600 hover:bg-orange-700 h-12 px-8"
                  >
                    Refresh Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/company/overview')}
                    className="h-12 px-8"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't happen for admins, but as a safety net
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
      </div>
    </div>
  );
}
