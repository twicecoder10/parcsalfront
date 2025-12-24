import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Company */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-orange-600 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Track Shipment
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Get Started</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/auth/register-customer" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Send a parcel
                </Link>
              </li>
              <li>
                <Link href="/auth/register-company" className="text-gray-600 hover:text-orange-600 transition-colors">
                  List a shipment
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
