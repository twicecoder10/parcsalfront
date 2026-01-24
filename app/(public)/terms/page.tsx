import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: 21 January 2026</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700">
                By accessing and using Parcsal, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Use Licence</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily use Parcsal for personal, non-commercial transitory viewing only. This is the grant of a licence, not a transfer of title, and under this licence you may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on Parcsal</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Booking and Payments</h2>
              <p className="text-gray-700 mb-4">
                When you book a shipment slot, you agree to pay the amount displayed at the time of booking. All payments are processed securely through our payment gateway. Refunds are subject to the cancellation policy of the individual shipment provider.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Shipment Providers</h2>
              <p className="text-gray-700 mb-4">
                Parcsal acts as a marketplace connecting customers with shipment providers. We are not responsible for the actual transportation of goods. Shipment providers are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Providing accurate information about their services</li>
                <li>Fulfilling bookings in a timely and professional manner</li>
                <li>Maintaining appropriate insurance coverage</li>
                <li>Handling any claims or disputes related to their services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Cancellation and Refunds</h2>
              <p className="text-gray-700 mb-4">
                Cancellation policies vary by shipment provider and booking status. Please review the specific terms before booking. Refund processing times may vary based on your payment method.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700">
                In no event shall Parcsal or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Parcsal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Privacy</h2>
              <p className="text-gray-700">
                Your use of Parcsal is also governed by our Privacy Policy. Please review our{' '}
                <a href="/privacy-policy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>{' '}
                to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Analytics &amp; Product Improvement</h2>
              <p className="text-gray-700">
                We use analytics tools (including PostHog) to understand how the platform is used and to improve our product.
                Analytics tracking is only enabled after you provide cookie consent. For more information, please see our{' '}
                <a href="/cookie-policy" className="text-blue-600 hover:underline">
                  Cookie Policy
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Marketing Communications</h2>
              <p className="text-gray-700">
                We may send service-related notifications that are necessary to provide the platform, such as booking updates,
                payment confirmations, and account notices. Promotional emails or WhatsApp messages are sent only where you have
                consented, or where the message is transactional or service-based. You can opt out of marketing communications at
                any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Carrier Marketing Tools</h2>
              <p className="text-gray-700 mb-4">
                If carriers use Parcsal tools to send campaigns, carriers are responsible for ensuring all communications are
                lawful and appropriate. Carriers must not send illegal, spam, or harassing content and must comply with UK data
                protection law, including GDPR and PECR. Parcsal may suspend or terminate accounts that abuse these tools and may
                enforce plan limits and pay-as-you-go credit limits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Privacy of Communications</h2>
              <p className="text-gray-700">
                Messaging within the platform does not expose personal email addresses or phone numbers to other users. We may
                process message metadata and content as needed to operate the platform, provide support, and moderate misuse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Service Availability / Changes</h2>
              <p className="text-gray-700">
                We may update, change, or discontinue features from time to time. Plan entitlements and limits may also be updated.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please contact us at legal@parcsal.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

