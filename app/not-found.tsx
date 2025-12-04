'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center">
          {/* Animated 404 */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-700 mb-4">
              404
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-700 mx-auto rounded-full"></div>
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Oops! The page you&apos;re looking for doesn&apos;t exist.
            </p>
            <p className="text-sm text-gray-500">
              It might have been moved, deleted, or the URL might be incorrect.
            </p>
          </div>

          {/* Illustration/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center">
                <Search className="w-16 h-16 text-orange-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 h-11">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="px-6 h-11"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Popular Pages:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
              >
                Home
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href="/features"
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
              >
                Features
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href="/pricing"
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
              >
                Pricing
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href="/auth/login"
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

