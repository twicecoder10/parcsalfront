import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-orange-600 mb-4">Parcsal</h3>
            <p className="text-sm text-gray-600">
              The marketplace for shipment slots. Connect shippers with available capacity.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/features" className="hover:text-orange-600">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-orange-600">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-orange-600">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/about" className="hover:text-orange-600">About</Link></li>
              <li><Link href="/contact" className="hover:text-orange-600">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/privacy" className="hover:text-orange-600">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-orange-600">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        {/* <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Parcsal. All rights reserved.
        </div> */}
      </div>
    </footer>
  );
}

