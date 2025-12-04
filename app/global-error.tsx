'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50 px-4">
          <div className="w-full max-w-md text-center">
            {/* Error Icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Critical Error
              </h1>
              <p className="text-base text-gray-600 mb-4">
                A critical error occurred that prevented the application from loading properly.
              </p>
              {error.message && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                  <p className="text-xs font-medium text-red-800 mb-1">Error:</p>
                  <p className="text-xs text-red-700 font-mono break-all">
                    {error.message}
                  </p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 h-11 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Application
            </button>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If the problem persists, please refresh the page or contact support.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

