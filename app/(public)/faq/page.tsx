import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQPage() {
  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is Parcsal?',
          a: 'Parcsal is a marketplace platform that connects customers who need to ship items with companies that have available shipment capacity. We make it easy to find and book shipment slots for your shipping needs.',
        },
        {
          q: 'How does Parcsal work?',
          a: 'Customers can search for available shipment slots by origin, destination, and date. Companies list their available capacity with pricing. Customers book slots, make payment, and track their shipments until delivery.',
        },
        {
          q: 'Is Parcsal available in my country?',
          a: 'Parcsal is currently available in multiple countries. Check our pricing page or contact support to see if we operate in your region.',
        },
      ],
    },
    {
      category: 'For Customers',
      questions: [
        {
          q: 'How do I book a shipment slot?',
          a: 'Search for available shipments using our search filters, select a shipment that meets your needs, enter your shipment details (weight or item count), and complete the payment. The company will accept your booking and handle the shipment.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept major credit cards, debit cards, and other secure payment methods. All payments are processed securely through our payment gateway.',
        },
        {
          q: 'Can I cancel a booking?',
          a: 'Yes, you can cancel bookings depending on the shipment status. Pending bookings can usually be cancelled, while accepted or in-transit bookings may have cancellation policies. Check your booking details for specific terms.',
        },
        {
          q: 'How do I track my shipment?',
          a: 'Once your booking is accepted, you can track your shipment status in real-time through your dashboard. You will also receive notifications about status updates.',
        },
        {
          q: 'What happens if my shipment is damaged or lost?',
          a: 'Parcsal requires all companies to have proper insurance. If an issue occurs, contact support immediately, and we will help resolve the matter according to our terms of service.',
        },
      ],
    },
    {
      category: 'For Companies',
      questions: [
        {
          q: 'How do I list my shipment slots?',
          a: 'Sign up as a company, choose a subscription plan, and start creating shipment slots. You can set routes, dates, capacity, and pricing. Once published, customers can book your slots.',
        },
        {
          q: 'What subscription plans are available?',
          a: 'We offer Basic, Pro, and Enterprise plans with different features and limits. Visit our pricing page to see detailed comparisons and choose the plan that fits your business.',
        },
        {
          q: 'How do I get paid?',
          a: 'Payments are automatically processed when customers book your slots. Funds are transferred to your account according to our payment schedule, typically within 2-5 business days after delivery.',
        },
        {
          q: 'Can I manage my team?',
          a: 'Yes, with Pro and Enterprise plans, you can invite team members and assign roles (Admin or Staff) to help manage your shipment operations.',
        },
        {
          q: 'What fees does Parcsal charge?',
          a: 'We charge a transaction fee per booking. The exact percentage depends on your subscription plan. See our pricing page for detailed fee structures.',
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your email to reset your password.',
        },
        {
          q: 'How do I verify my email?',
          a: 'After registration, check your email inbox for a verification link. Click the link to verify your email address. If you didn\'t receive it, check your spam folder or request a new verification email.',
        },
        {
          q: 'Is my data secure?',
          a: 'Yes, we use industry-standard encryption to protect your data. All personal information and payment details are secured according to the highest security standards.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
              <p className="text-xl text-gray-600">
                Find answers to common questions about Parcsal
              </p>
            </div>

            {/* FAQ Sections */}
            <div className="space-y-8">
              {faqs.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Still have questions */}
            <Card className="mt-12">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
                  <p className="text-gray-600 mb-4">
                    Can&apos;t find the answer you&apos;re looking for? Please contact our support team.
                  </p>
                  <a href="/contact">
                    <button className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                      Contact Support
                    </button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

