'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { getStoredUser, getDashboardPath } from '@/lib/auth';
import { Mail, CheckCircle2, ArrowLeft, Loader2, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      // Still show success message for security (don't reveal if email exists)
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }

    forgotPasswordMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {submitted ? 'Check Your Email' : 'Forgot Password'}
            </h1>
            <p className="text-gray-600">
              {submitted
                ? 'We&apos;ve sent you a password reset link'
                : 'No worries! Enter your email and we&apos;ll send you reset instructions'}
            </p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              {submitted ? (
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-4">
                      <MailCheck className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Email Sent!</h3>
                    <p className="text-sm text-gray-600 px-4">
                      If an account with <span className="font-medium text-gray-900">{email}</span> exists, 
                      you&apos;ll receive password reset instructions shortly.
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                      Didn&apos;t receive the email? Check your spam folder or try again.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Link href="/auth/login">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 h-11">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSubmitted(false);
                        setEmail('');
                      }}
                    >
                      Send to Different Email
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-5">
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
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Enter the email address associated with your account
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
                      disabled={forgotPasswordMutation.isPending || !email}
                    >
                      {forgotPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Reset Link
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t">
                    <Link href="/auth/login">
                      <Button variant="ghost" className="w-full" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
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

