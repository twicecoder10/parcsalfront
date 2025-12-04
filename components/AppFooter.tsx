import Link from 'next/link';
import { PoweredByCosonas } from './PoweredByCosonas';

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-white py-4">
      <div className="container mx-auto px-4">
        {/* Mobile layout - stacked */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="text-sm text-gray-600">
            © {currentYear} Parcsal. All rights reserved.
          </div>
          <div className="flex items-center">
            <PoweredByCosonas />
          </div>
          {/* <div className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-400">·</span>
            <Link
              href="/terms"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms
            </Link>
          </div> */}
        </div>

        {/* Desktop layout - single row */}
        <div className="hidden md:flex md:items-center md:justify-center md:gap-3 md:text-sm">
          <span className="text-gray-600">
            © {currentYear} Parcsal. All rights reserved.
          </span>
          <span className="text-gray-300">|</span>
          <PoweredByCosonas />
          <span className="text-gray-300">|</span>
          <Link
            href="/privacy"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/terms"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
