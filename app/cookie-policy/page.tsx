import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CookiePreferencesButton } from '@/components/cookie/CookiePreferencesButton';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <section className="bg-gradient-to-br from-orange-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm text-gray-500">Last updated: 21 January 2026</p>
              <h1 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900">Cookie Policy</h1>
              <p className="mt-4 text-lg text-gray-600">
                How Parcsal uses cookies and similar technologies
              </p>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>What are cookies?</CardTitle>
                  <CardDescription>
                    Cookies are small text files placed on your device when you visit a website. They help
                    the site remember your actions and preferences, and can enable features like secure
                    sign-in. Similar technologies include local storage and pixels.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Why we use cookies</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>Keep Parcsal secure and operating reliably.</li>
                    <li>Remember essential choices, like authentication and session settings.</li>
                    <li>Understand usage so we can improve performance and user experience.</li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-500">
                    Optional cookies are used only with your consent, in line with UK/EU GDPR and PECR.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Types of cookies we use</CardTitle>
                  <CardDescription>
                    We separate cookies into categories so you can control non-essential usage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-gray-600">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="font-semibold text-gray-900">Necessary (always on)</p>
                    <p className="text-sm">
                      Required to provide core functionality, security, and to keep the site running.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="font-semibold text-gray-900">Analytics (optional)</p>
                    <p className="text-sm">
                      Helps us understand how the site is used so we can improve it. Includes PostHog,
                      and is enabled only after consent.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="font-semibold text-gray-900">Marketing (optional)</p>
                    <p className="text-sm">
                      Reserved for future marketing and personalization features. Currently not enabled.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How to manage cookie preferences</CardTitle>
                  <CardDescription>
                    You will see a cookie banner when you first visit Parcsal. You can change your choices
                    at any time using the button below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-gray-600">
                    Non-essential cookies are off by default until you consent. You can withdraw or update
                    consent whenever you like.
                  </p>
                  <CookiePreferencesButton className="bg-orange-600 hover:bg-orange-700" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Third-party services</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We use PostHog Analytics to understand how our website is used and to improve it.
                    PostHog is activated only after you opt in to analytics cookies.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                  <CardDescription>
                    For questions about this policy or your cookie preferences, contact us at{' '}
                    <span className="text-orange-600">support@parcsal.co.uk</span>.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

