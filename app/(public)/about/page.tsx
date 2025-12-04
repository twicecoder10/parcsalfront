import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Zap, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-orange-50 to-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-gray-900">About Parcsal</h1>
              <p className="text-xl text-gray-600">
                Revolutionizing the shipment industry by connecting shippers with available capacity through an innovative marketplace platform.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Our Mission</h2>
              <p className="text-lg text-gray-700 text-center mb-8">
                At Parcsal, we believe that shipping should be accessible, efficient, and transparent. 
                Our platform bridges the gap between companies with available shipping capacity and customers 
                who need reliable transportation services.
              </p>
              <div className="grid md:grid-cols-2 gap-8 mt-12">
                <Card>
                  <CardHeader>
                    <Target className="h-10 w-10 text-orange-600 mb-4" />
                    <CardTitle>Our Goal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      To create the most trusted marketplace for shipment slots, making shipping 
                      accessible to everyone while helping logistics companies maximize their capacity utilization.
                    </CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Zap className="h-10 w-10 text-orange-600 mb-4" />
                    <CardTitle>Our Vision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      To transform the logistics industry by providing a platform that connects 
                      businesses and individuals with reliable shipping solutions in real-time.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-orange-600 mb-4" />
                  <CardTitle>Trust & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We prioritize the security of your shipments and data. Every transaction is protected 
                    with industry-standard encryption and verification.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-orange-600 mb-4" />
                  <CardTitle>Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our platform streamlines the booking process, making it fast and easy to find 
                    and book the perfect shipment slot for your needs.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-orange-600 mb-4" />
                  <CardTitle>Accessibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We believe shipping should be accessible to everyone, from individuals sending 
                    personal items to businesses managing supply chains.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">1000+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">500+</div>
                <div className="text-gray-600">Verified Companies</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">10K+</div>
                <div className="text-gray-600">Shipments Booked</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">99%</div>
                <div className="text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

