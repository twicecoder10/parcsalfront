import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Check, Package, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: '£0',
      period: '/month',
      commission: '15%',
      tagline: 'Get started — list for free, pay only when you get bookings',
      recommended: false,
      features: {
        operations: [
          'List services on Parcsal (standard ranking)',
          'Create/manage Slots & Bookings with simple label printing',
        ],
        customers: [
          'View reviews/ratings',
          'Reply to messages one-to-one',
        ],
        money: [
          'View Payments & Payouts',
          'Standard payout within 48 hours of delivery',
        ],
        marketing: [
          'Basic analytics (shipments, revenue, average rating)',
          'Email + SMS/WhatsApp system notifications only',
          'Promo campaigns via pay-as-you-go credits',
        ],
        account: [
          '1 admin user',
        ],
      },
      cta: 'Get started',
      ctaLink: '/auth/register-company',
    },
    {
      id: 'STARTER',
      name: 'Starter',
      price: '£49',
      period: '/month',
      commission: '15%',
      tagline: 'Grow your volume — priority visibility + marketing tools',
      recommended: true,
      features: {
        operations: [
          'Everything in Free',
          'Slot templates to reuse offers',
        ],
        customers: [
          '"Verified Carrier" badge on listings',
        ],
        money: [
          'Faster payouts (24–48 hours)',
          'Simple CSV exports',
        ],
        insights: [
          'Enhanced analytics: corridor/service breakdown',
          'New vs repeat customers, basic conversion metrics',
        ],
        marketing: [
          'Email campaigns to past customers (up to 5,000/month; extra billed)',
          '100 promotional SMS/WhatsApp credits/month; extra via topups',
          'Prebuilt promo & reminder templates',
        ],
        account: [
          'Up to 3 team members',
        ],
      },
      cta: 'Upgrade',
      ctaLink: '/auth/register-company',
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: '£149',
      period: '/month',
      commission: '15%',
      tagline: 'Scale your operations — advanced analytics + dedicated support',
      recommended: false,
      features: {
        operations: [
          'Everything in Starter',
          'Advanced slot rules (automation, bulk uploads, day-of-week pricing)',
          'Priority search ranking above Free & Starter',
          'Access to Scan and Warehouses modules',
        ],
        customers: [
          'Featured placement and "Recommended Carrier" rotation',
        ],
        money: [
          'Next-day payout options',
          'Detailed reconciliation-ready reports',
        ],
        insights: [
          'Full analytics suite (profitability, cohorts, funnel)',
          'A/B testing dashboard',
        ],
        marketing: [
          'Higher email limits (up to 20,000/month) with segmentation, scheduling & A/B tests',
          '500 promotional SMS/WhatsApp credits/month with discounted extra packs',
          'Premium templates and branding options',
        ],
        account: [
          'Up to 10 team members with role-based permissions',
          'Dedicated success contact',
        ],
      },
      cta: 'Upgrade',
      ctaLink: '/auth/register-company',
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 'From £500',
      period: '/month',
      commission: '15% standard (12–14% negotiable)',
      tagline: 'Partnership tier — custom solution for large logistics groups',
      recommended: false,
      features: {
        partnership: [
          'Dedicated account manager and joint business reviews',
          'Custom SLAs on support, claims, and payouts',
        ],
        operations: [
          'Everything in Professional',
          'Multi-branch / multi-country structure with separate dashboards',
          'Fully custom workflows and deep API integrations (bookings, labels, tracking, analytics)',
        ],
        data: [
          'Custom reporting exports and data feeds into internal systems',
          'Co-branded landing pages and exclusive corridor promotions',
        ],
        account: [
          'Unlimited users with advanced role and access controls',
        ],
      },
      cta: 'Contact sales',
      ctaLink: '/contact',
    },
  ];

  const comparisonData = [
    { feature: 'Team members', free: '1', starter: '3', professional: '10', enterprise: 'Unlimited' },
    { feature: 'Search ranking', free: 'Standard', starter: 'Priority', professional: 'Highest', enterprise: 'Custom' },
    { feature: 'Payout speed', free: '48h', starter: '24–48h', professional: 'Next-day', enterprise: 'SLA' },
    { feature: 'Email campaigns', free: 'Pay-as-you-go', starter: '5,000/month', professional: '20,000/month', enterprise: 'Custom' },
    { feature: 'Promo credits', free: 'Pay-as-you-go', starter: '100/month', professional: '500/month', enterprise: 'Custom' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pt-16 md:pt-20">
        {/* Hero Section */}
        <section className="relative py-12 md:py-16 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/images/categories/warehouse.jpg"
              alt="Warehouse"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Simple, transparent pricing
              </h1>
              <p className="text-xl text-gray-600">
                Choose the plan that works best for your business
              </p>
            </div>
          </div>
        </section>

        {/* Customer Pricing */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-orange-200 bg-orange-50/30">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">For Customers</CardTitle>
                      <CardDescription className="text-base">Pay per booking - No monthly fees</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">What you get:</h3>
                      <ul className="space-y-3">
                        {[
                          'No subscription required',
                          'Pay only when you ship',
                          'Transparent pricing',
                          'Secure payments',
                          'Real-time tracking',
                          'In-app messaging',
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="bg-white rounded-xl p-6 border-2 border-orange-200 mb-6">
                        <div className="text-center mb-4">
                          <div className="text-4xl font-bold text-gray-900 mb-2">Free</div>
                          <p className="text-gray-600">to get started</p>
                        </div>
                        <p className="text-sm text-gray-600 text-center mb-4">
                          Pay only the shipping cost shown when you book
                        </p>
                      </div>
                      <Link href="/auth/register-customer">
                        <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-700 h-14">
                          Get started free
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Company Pricing */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                For Companies & Carriers
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Subscription plans to maximize your capacity
              </p>
              <p className="text-sm text-gray-500">
                Commission: 15% per shipment on all plans (Enterprise negotiable)
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`border-2 hover:shadow-xl transition-all flex flex-col ${
                    plan.recommended 
                      ? 'border-orange-300 shadow-lg md:scale-105' 
                      : 'border-gray-200 hover:border-orange-200'
                  } relative`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-orange-600 text-white px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl mb-1">{plan.name}</CardTitle>
                    <CardDescription className="text-sm min-h-[2.5rem]">{plan.tagline}</CardDescription>
                    <div className="mt-4 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 text-base">{plan.period}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Commission: </span>
                      <span>{plan.commission} per shipment</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-4 mb-6 flex-1">
                      {plan.features.operations && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Operations</h4>
                          <ul className="space-y-2">
                            {plan.features.operations.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {plan.features.customers && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Customers</h4>
                          <ul className="space-y-2">
                            {plan.features.customers.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {plan.features.money && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Money & Payout</h4>
                          <ul className="space-y-2">
                            {plan.features.money.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {plan.features.insights && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Insights</h4>
                          <ul className="space-y-2">
                            {plan.features.insights.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {plan.features.marketing && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Marketing</h4>
                          <ul className="space-y-2">
                            {plan.features.marketing.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {plan.features.partnership && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Partnership & Support</h4>
                          <ul className="space-y-2">
                            {plan.features.partnership.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {plan.features.data && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Data & Marketing</h4>
                          <ul className="space-y-2">
                            {plan.features.data.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {plan.features.account && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Account</h4>
                          <ul className="space-y-2">
                            {plan.features.account.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <Link href={plan.ctaLink} className="block mt-auto">
                      <Button
                        size="lg"
                        className={`w-full ${
                          plan.recommended 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : plan.id === 'ENTERPRISE'
                            ? 'bg-gray-900 hover:bg-gray-800'
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        {plan.cta}
                        {plan.id !== 'ENTERPRISE' && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="max-w-6xl mx-auto mt-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Plan Comparison</CardTitle>
                  <CardDescription className="text-center">
                    Compare key features across all plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Feature</TableHead>
                          <TableHead className="text-center">Free</TableHead>
                          <TableHead className="text-center">Starter</TableHead>
                          <TableHead className="text-center">Professional</TableHead>
                          <TableHead className="text-center">Enterprise</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.feature}</TableCell>
                            <TableCell className="text-center">{row.free}</TableCell>
                            <TableCell className="text-center">{row.starter}</TableCell>
                            <TableCell className="text-center">{row.professional}</TableCell>
                            <TableCell className="text-center">{row.enterprise}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Marketing campaign limits apply; top-ups available. Payout timing depends on delivery confirmation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Frequently asked questions
              </h2>
              <div className="space-y-6">
                {[
                  {
                    question: 'What is the commission rate?',
                    answer: 'All plans charge 15% commission per shipment. Enterprise plans may negotiate rates between 12–14% based on volume and partnership terms.',
                  },
                  {
                    question: 'Can I switch plans later?',
                    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
                  },
                  {
                    question: 'How do payouts work?',
                    answer: 'Payout timing depends on your plan: Free (48 hours), Starter (24–48 hours), Professional (next-day options), Enterprise (custom SLA). Payouts are processed after delivery confirmation.',
                  },
                  {
                    question: 'Are there limits on marketing campaigns?',
                    answer: 'Yes, marketing campaign limits vary by plan. Free uses pay-as-you-go credits, Starter includes 5,000 emails/month and 100 SMS/WhatsApp credits, Professional includes 20,000 emails/month and 500 SMS/WhatsApp credits. Extra usage can be purchased via top-ups.',
                  },
                  {
                    question: 'Is there a setup fee?',
                    answer: 'No, there are no setup fees. You only pay the monthly subscription for your chosen plan (Free plan has no monthly fee).',
                  },
                  {
                    question: 'What payment methods do you accept?',
                    answer: 'We accept all major credit cards, debit cards, and bank transfers through our secure payment processor, Stripe.',
                  },
                  {
                    question: 'Can I cancel anytime?',
                    answer: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.',
                  },
                ].map((faq, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-orange-600 to-orange-500 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-white/95 mb-8">
                Join thousands of businesses already using Parcsal
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register-customer">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 px-8 h-14">
                    Start as customer
                  </Button>
                </Link>
                <Link href="/auth/register-company">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 h-14">
                    Start as company
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

