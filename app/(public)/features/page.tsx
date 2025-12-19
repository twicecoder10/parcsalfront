import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Shield, Clock, PoundSterling, BarChart3, Users, Bell, MapPin, Package } from 'lucide-react';

export default function FeaturesPage() {
  const customerFeatures = [
    {
      icon: Search,
      title: 'Easy Search',
      description: 'Search for shipments by origin, destination, date, and more with our intuitive search interface.',
    },
    {
      icon: MapPin,
      title: 'Real-time Tracking',
      description: 'Track your shipments in real-time with live updates on location and delivery status.',
    },
    {
      icon: PoundSterling,
      title: 'Transparent Pricing',
      description: 'See all costs upfront with no hidden fees. Compare prices across different providers.',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Your payments are processed securely using industry-standard encryption and fraud protection.',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Get instant notifications about booking confirmations, status updates, and delivery alerts.',
    },
    {
      icon: Package,
      title: 'Multiple Booking Options',
      description: 'Book by weight, item count, or flat rate depending on your shipment needs.',
    },
  ];

  const companyFeatures = [
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Get insights into your shipment operations with detailed analytics and reports.',
    },
    {
      icon: Clock,
      title: 'Efficient Management',
      description: 'Manage all your shipment slots, bookings, and team members from one central dashboard.',
    },
    {
      icon: PoundSterling,
      title: 'Revenue Optimization',
      description: 'Maximize your capacity utilization and revenue with dynamic pricing and demand insights.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite team members and manage roles to streamline your operations.',
    },
    {
      icon: Bell,
      title: 'Booking Alerts',
      description: 'Receive instant notifications when customers book your shipment slots.',
    },
    {
      icon: Shield,
      title: 'Verified Status',
      description: 'Build trust with verified company badges and customer reviews.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-orange-50 to-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-gray-900">Features</h1>
              <p className="text-xl text-gray-600">
                Everything you need to find or manage shipment slots efficiently
              </p>
            </div>
          </div>
        </section>

        {/* Customer Features */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">For Customers</h2>
              <p className="text-lg text-gray-600">Everything you need to find and book shipments</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {customerFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="rounded-full bg-orange-100 p-3 w-fit mb-4">
                        <Icon className="h-6 w-6 text-orange-600" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Company Features */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">For Companies</h2>
              <p className="text-lg text-gray-600">Powerful tools to manage your shipping operations</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {companyFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="rounded-full bg-orange-100 p-3 w-fit mb-4">
                        <Icon className="h-6 w-6 text-orange-600" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-orange-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-orange-100 mb-8">
              Join thousands of users who are already using Parcsal
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register-customer">
                <Button size="lg" variant="secondary">
                  Sign Up as Customer
                </Button>
              </Link>
              <Link href="/auth/register-company">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                  Sign Up as Company
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

