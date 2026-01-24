'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/password-input';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { authApi, getErrorMessage } from '@/lib/api';
import { saveAuthData, getPostAuthPathAsync, getStoredUser, getDashboardPath } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { identifyUser } from '@/lib/posthog';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const redirectUrl = searchParams.get('redirect');

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    const user = getStoredUser();
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (user && token) {
      // If there's a redirect URL, use it; otherwise go to dashboard
      const redirect = redirectUrl || getDashboardPath(user.role);
      router.push(redirect);
    } else {
      setIsChecking(false);
    }
  }, [router, redirectUrl]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      saveAuthData(data);
      // Identify user in PostHog
      identifyUser(data.user, data.user.company?.plan || null);
      // If there's a redirect URL, use it; otherwise get the appropriate onboarding step path or dashboard path
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        const redirectPath = await getPostAuthPathAsync(data.user);
        router.push(redirectPath);
      }
    },
    onError: (err: any) => {
      // Extract error message from API response, fallback to default
      const errorMessage = getErrorMessage(err) || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    loginMutation.mutate({ email, password });
  };

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-12">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue to Parcsal</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Login Failed</p>
                      <p className="text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <p className="text-center text-sm text-gray-600 mb-4">
                  Don&apos;t have an account?
                </p>
                <div className="flex gap-3">
                  <Link href="/auth/register-customer" className="flex-1">
                    <Button variant="outline" className="w-full h-10">
                      Sign Up as Customer
                    </Button>
                  </Link>
                  <Link href="/auth/register-company" className="flex-1">
                    <Button variant="outline" className="w-full h-10">
                      Sign Up as Company
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-orange-600 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-orange-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
        <Footer />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

