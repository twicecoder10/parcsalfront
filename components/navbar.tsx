'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md group-hover:shadow-lg transition-shadow">
              P
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Parcsal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <Link href="/#how-it-works">
              <Button variant="ghost" className="text-sm font-medium hover:text-orange-600 hover:bg-orange-50">
                How it works
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="text-sm font-medium hover:text-orange-600 hover:bg-orange-50">
                Pricing
              </Button>
            </Link>
            <Link href="/#safety">
              <Button variant="ghost" className="text-sm font-medium hover:text-orange-600 hover:bg-orange-50">
                Safety
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="text-sm font-medium hover:text-orange-600 hover:bg-orange-50">
                Contact
              </Button>
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm font-medium hover:text-orange-600 hover:bg-orange-50">
                Log in
              </Button>
            </Link>
            <Link href="/auth/register-company">
              <Button className="bg-orange-600 hover:bg-orange-700 text-sm font-medium px-5 shadow-sm hover:shadow-md transition-all">
                List a shipment
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-orange-600 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t animate-slide-in">
            <div className="flex flex-col gap-2">
              <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm hover:text-orange-600 hover:bg-orange-50">
                  How it works
                </Button>
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm hover:text-orange-600 hover:bg-orange-50">
                  Pricing
                </Button>
              </Link>
              <Link href="/#safety" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm hover:text-orange-600 hover:bg-orange-50">
                  Safety
                </Button>
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm hover:text-orange-600 hover:bg-orange-50">
                  Contact
                </Button>
              </Link>
              
              <div className="pt-4 mt-4 border-t flex flex-col gap-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full text-sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register-company" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-sm">
                    List a shipment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
