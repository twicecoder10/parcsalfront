'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PasswordInput } from '@/components/password-input';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { getStoredUser, getDashboardPath } from '@/lib/auth';
import { CheckCircle2, AlertCircle, Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in and no token (they navigated directly)
  useEffect(() => {
    const user = getStoredUser();
    const authToken = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') || localStorage.getItem('token')
      : null;
    
    if (user && authToken && !token) {
      // If logged in and no reset token, redirect to dashboard
      router.push(getDashboardPath(user.role));
    } else if (!token) {
      // If no reset token at all, redirect to forgot password
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message;
      if (err.response?.status === 400 || err.response?.status === 410) {
        setError(errorMessage || 'This reset link is invalid or has expired. Please request a new one.');
      } else {
        setError(errorMessage || 'Failed to reset password. Please try again.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.');
      return;
    }

    resetPasswordMutation.mutate({ token, password });
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const hasMinLength = password.length >= 8;

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {success ? 'Password Reset!' : 'Reset Your Password'}
            </h1>
            <p className="text-gray-600">
              {success
                ? 'Your password has been successfully changed'
                : 'Enter your new password below'}
            </p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              {success ? (
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Success!</h3>
                    <p className="text-sm text-gray-600">
                      Your password has been reset successfully. You&apos;ll be redirected to the login page in a few seconds.
                    </p>
                  </div>

                  <Link href="/auth/login">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 h-11">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Go to Login
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Reset Failed</p>
                          <p className="text-red-600">{error}</p>
                          {error.includes('expired') && (
                            <Link href="/auth/forgot-password" className="text-xs text-red-600 underline mt-1 inline-block">
                              Request a new reset link
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <PasswordInput
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 h-11"
                          required
                          autoComplete="new-password"
                          placeholder="Enter new password"
                          showStrength={true}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <PasswordInput
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 h-11"
                          required
                          autoComplete="new-password"
                          placeholder="Confirm new password"
                        />
                      </div>
                      {confirmPassword && (
                        <div className="flex items-center gap-2 text-xs">
                          {passwordsMatch ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">Passwords do not match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pb-2">
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`} />
                        <span>At least 8 characters long</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${passwordsMatch ? 'text-green-600' : 'text-gray-400'}`} />
                        <span>Passwords match</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
                      disabled={resetPasswordMutation.isPending || !password || !confirmPassword || !passwordsMatch || !hasMinLength}
                    >
                      {resetPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting Password...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Reset Password
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t">
                    <Link href="/auth/login">
                      <Button variant="ghost" className="w-full" size="sm">
                        ← Back to Login
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardContent className="text-center py-8">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

