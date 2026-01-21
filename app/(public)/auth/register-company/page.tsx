'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { authApi, getErrorMessage } from '@/lib/api';
import { saveAuthData, getPostAuthPathAsync, getStoredUser, getDashboardPath } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { Mail, User, Building2, Lock, AlertCircle, Loader2, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { PasswordInput } from '@/components/password-input';

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    const user = getStoredUser();
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') || localStorage.getItem('token')
      : null;
    
    if (user && token) {
      router.push(getDashboardPath(user.role));
    }
  }, [router]);

  const registerMutation = useMutation({
    mutationFn: authApi.registerCompany,
    onSuccess: async (data) => {
      saveAuthData(data);
      // Get the appropriate onboarding step path or dashboard path
      const redirectPath = await getPostAuthPathAsync(data.user);
      router.push(redirectPath);
    },
    onError: (err: any) => {
      const errorMessage = getErrorMessage(err) || 'Registration failed. Please try again.';
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    registerMutation.mutate({ 
      fullName: name, 
      companyName, 
      email, 
      companyCountry: country, 
      companyCity: city,
      password 
    });
  };

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Company Account</h1>
              <p className="text-gray-600">Sign up to start listing your shipment slots</p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Registration Failed</p>
                        <p className="text-red-600">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Admin Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-11"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                      Company Name
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="ABC Logistics"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <CountrySelect
                    value={country}
                    onChange={(value) => {
                      setCountry(value);
                      setCity('');
                    }}
                    label="Country"
                    placeholder="Select country"
                    required
                    allowedCountries={['UK', 'Ireland', 'France', 'Spain', 'Italy', 'Germany', 'Netherlands', 'Belgium', 'Switzerland', 'USA']}
                  />
                  <CitySelect
                    value={city}
                    onChange={(value) => setCity(value)}
                    country={country}
                    label="City"
                    placeholder="Select city"
                    required
                    disabled={!country}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Enter your password"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Company Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-center text-sm text-gray-600 mb-4">
                    Already have an account?
                  </p>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full h-10">
                      Sign In
                    </Button>
                  </Link>
                </div>

                {/* Fancy Customer Signup Link */}
                <div className="mt-6 pt-6 border-t">
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="rounded-full bg-blue-200 p-2">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Not a company?
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Sign up as a customer to book shipment slots
                        </p>
                      </div>
                      <Link href="/auth/register-customer">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-200 whitespace-nowrap"
                        >
                          Sign Up as Customer
                          <Sparkles className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="text-orange-600 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-orange-600 hover:underline">Privacy Policy</Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    </GoogleMapsLoader>
  );
}

