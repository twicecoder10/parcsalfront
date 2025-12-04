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
import { authApi } from '@/lib/api';
import { saveAuthData, getPostAuthPathAsync, getStoredUser, getDashboardPath } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { Mail, User, AlertCircle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Extract token from URL and check if already logged in
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    const user = getStoredUser();
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    // Redirect if already logged in
    if (user && storedToken) {
      router.push(getDashboardPath(user.role));
      return;
    }

    // Extract token from URL
    const urlToken = searchParams.get('token');
    if (!urlToken) {
      setError('Invalid invitation link. No token provided.');
      setIsChecking(false);
      return;
    }

    setToken(urlToken);
    setIsChecking(false);
  }, [searchParams, router]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    setPasswordStrength(strength);
  }, [password]);

  const acceptInvitationMutation = useMutation({
    mutationFn: ({ token, password, fullName }: { token: string; password: string; fullName: string }) =>
      authApi.acceptInvitation(token, { password, fullName }),
    onSuccess: async (data) => {
      saveAuthData(data);
      // Get the appropriate onboarding step path or dashboard path
      const redirectPath = await getPostAuthPathAsync(data.user);
      router.push(redirectPath);
    },
    onError: (err: any) => {
      let errorMessage = 'Failed to accept invitation. Please try again.';
      
      // Handle specific error status codes
      if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Invalid token, expired invitation, or already used.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Invitation not found. The invitation link may be invalid.';
      } else if (err.response?.status === 409) {
        errorMessage = 'You are already a member of this company.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Invalid invitation link. Please request a new invitation.');
      return;
    }

    acceptInvitationMutation.mutate({ token, password, fullName });
  };

  // Show loading state while checking token
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

  // Show error if no token
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-red-600">
                Invalid Invitation Link
              </CardTitle>
              <CardDescription className="text-center">
                {error || 'The invitation link is invalid or missing a token.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Please contact your company administrator to request a new invitation.
                </p>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Accept Team Invitation
            </CardTitle>
            <CardDescription className="text-center">
              Complete your account setup to join the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {email && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500">This email was used for your invitation</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= passwordStrength
                              ? level <= 2
                                ? 'bg-red-500'
                                : level <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {passwordStrength <= 2
                        ? 'Weak password'
                        : passwordStrength <= 3
                        ? 'Medium strength'
                        : 'Strong password'}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Passwords match</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={acceptInvitationMutation.isPending}
              >
                {acceptInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting Invitation...
                  </>
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm space-y-2">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-orange-600 hover:underline">
                  Sign in
                </Link>
              </p>
              {error && (
                <p className="text-gray-500 text-xs">
                  Need help? Contact your company administrator or{' '}
                  <Link href="/contact" className="text-orange-600 hover:underline">
                    contact support
                  </Link>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
          </div>
          <Footer />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}

