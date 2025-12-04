'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { saveAuthData, getPostAuthPathAsync, getStoredUser, getDashboardPath } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';

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
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Company Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up to start listing your shipment slots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Admin Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="ABC Logistics"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create Company Account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/auth/login" className="text-orange-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </GoogleMapsLoader>
  );
}

