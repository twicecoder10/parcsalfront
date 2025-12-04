'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold text-orange-600">
          Parcsal
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/features">
            <Button variant="ghost" className="hidden md:inline-flex">Features</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost">Pricing</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" className="hidden md:inline-flex">About</Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" className="hidden md:inline-flex">Contact</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/auth/register-customer">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

