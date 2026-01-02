import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Check, Package, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Basic',
      price: '£29',
      period: '/month',
      description: 'Perfect for small companies getting started',
      features: [
        'Up to 10 active shipments',
        'Basic analytics',
        'Email support',
        'Standard booking management',
      ],
      recommended: false,
    },
    {
      name: 'Pro',
      price: '£99',
      period: '/month',
      description: 'Best for growing logistics businesses',
      features: [
        'Unlimited active shipments',
        'Advanced analytics & reports',
        'Priority email & phone support',
        'Advanced booking management',
        'Team collaboration tools',
        'API access',
      ],
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with custom needs',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees',
        'White-label options',
        'On-premise deployment',
      ],
      recommended: false,
    },
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
                For Companies
              </h2>
              <p className="text-lg text-gray-600">
                Subscription plans to maximize your capacity
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`border-2 hover:shadow-xl transition-all ${
                    plan.recommended 
                      ? 'border-orange-300 shadow-lg scale-105' 
                      : 'border-gray-200 hover:border-orange-200'
                  } relative`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-orange-600 text-white px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    <div className="mt-6 mb-2">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 text-lg">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/register-company" className="block">
                      <Button
                        size="lg"
                        className={`w-full ${
                          plan.recommended 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        {plan.name === 'Enterprise' ? 'Contact sales' : 'Get started'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
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
                    question: 'Can I switch plans later?',
                    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
                  },
                  {
                    question: 'Is there a setup fee?',
                    answer: 'No, there are no setup fees. You only pay the monthly subscription for your chosen plan.',
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

