'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { getPostAuthPathAsync, getStoredUser, setStoredUser, getDashboardPath } from '@/lib/auth';
import { checkEmailVerification } from '@/lib/onboarding';
import { CheckCircle2, XCircle, Mail, Loader2, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [email, setEmail] = useState('');

  // Redirect if already logged in and email is verified
  useEffect(() => {
    const user = getStoredUser();
    const authToken = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') || localStorage.getItem('token')
      : null;
    
    if (user && authToken && user.isEmailVerified) {
      // If logged in and email is already verified, redirect to dashboard
      router.push(getDashboardPath(user.role));
    }
  }, [router]);

  const verifyEmailMutation = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: async () => {
      setStatus('success');
      // After email verification, update stored user and redirect to next onboarding step
      try {
        const user = getStoredUser();
        if (user) {
          // Refresh user data to get updated onboarding status
          const updatedUser = await authApi.getCurrentUser();
          // Update stored user with isEmailVerified = true
          setStoredUser(updatedUser);
          const redirectPath = await getPostAuthPathAsync(updatedUser);
          setTimeout(() => {
            router.push(redirectPath);
          }, 2000);
        } else {
          // If no user in storage, redirect to login
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        }
      } catch (error) {
        // Fallback to login if there's an error
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    },
    onError: (err: any) => {
      if (err.response?.status === 410) {
        setStatus('expired');
      } else {
        setStatus('error');
      }
    },
  });

  // Mutation to manually check if email is verified (for "I've verified my email" button)
  const checkVerificationMutation = useMutation({
    mutationFn: async () => {
      // Refresh user data to check if email is now verified
      const updatedUser = await authApi.getCurrentUser();
      setStoredUser(updatedUser);
      return updatedUser;
    },
    onSuccess: async (updatedUser) => {
      if (updatedUser.isEmailVerified) {
        setStatus('success');
        // Redirect to next onboarding step
        const redirectPath = await getPostAuthPathAsync(updatedUser);
        setTimeout(() => {
          router.push(redirectPath);
        }, 1500);
      } else {
        // Email still not verified
        setStatus('error');
      }
    },
    onError: () => {
      setStatus('error');
    },
  });

  const resendMutation = useMutation({
    mutationFn: authApi.resendVerificationEmail,
    onSuccess: () => {
      setStatus('verifying');
    },
  });

  // Get user email from stored user
  useEffect(() => {
    const user = getStoredUser();
    if (user?.email) {
      setEmail(user.email);
    }
  }, []);

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate({ token });
    } else {
      // No token - user navigated directly to page or clicked link without token
      // Show the verification page with manual check option
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = () => {
    if (email) {
      resendMutation.mutate({ email });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'verifying' && (
              <div className="space-y-4 text-center py-8">
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
                </div>
                <p className="text-sm text-gray-600">
                  Verifying your email address...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Email Verified!</h3>
                  <p className="text-sm text-gray-600">
                    Your email has been successfully verified. Redirecting to continue setup...
                  </p>
                </div>
                <Link href="/auth/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-orange-100 p-3">
                    <Mail className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Please Verify Your Email</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {email 
                      ? `We've sent a verification email to ${email}. Please check your inbox and click the verification link.`
                      : 'Please verify your email address to continue. Check your inbox for the verification email.'}
                  </p>
                  {email && (
                    <p className="text-xs text-gray-500 mb-4">
                      Email: <span className="font-medium">{email}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  {/* Manual verification check button */}
                  <Button
                    onClick={() => checkVerificationMutation.mutate()}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={checkVerificationMutation.isPending}
                  >
                    {checkVerificationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        I&apos;ve Verified My Email
                      </>
                    )}
                  </Button>
                  
                  {/* Resend email section */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">Didn&apos;t receive the email?</p>
                    <div className="space-y-2">
                      {!email && (
                        <input
                          type="email"
                          placeholder="Enter your email"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      )}
                      <Button
                        onClick={handleResend}
                        variant="outline"
                        className="w-full"
                        disabled={resendMutation.isPending || !email}
                      >
                        {resendMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Verification Email
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-yellow-100 p-3">
                    <Mail className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verification Link Expired</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    The verification link has expired. Please request a new one.
                  </p>
                  {email && (
                    <p className="text-xs text-gray-500 mb-4">
                      Email: <span className="font-medium">{email}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  {/* Manual verification check button */}
                  <Button
                    onClick={() => checkVerificationMutation.mutate()}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={checkVerificationMutation.isPending}
                  >
                    {checkVerificationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        I&apos;ve Verified My Email
                      </>
                    )}
                  </Button>
                  
                  {/* Resend email section */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">Request a new verification email:</p>
                    {!email && (
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    )}
                    <Button
                      onClick={handleResend}
                      variant="outline"
                      className="w-full"
                      disabled={resendMutation.isPending || !email}
                    >
                      {resendMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

