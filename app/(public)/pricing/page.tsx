import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Check } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.recommended ? 'border-orange-600 border-2 relative' : ''}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-600">Recommended</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register-company" className="block">
                    <Button
                      className="w-full"
                      variant={plan.recommended ? 'default' : 'outline'}
                    >
                      Start as Company
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

