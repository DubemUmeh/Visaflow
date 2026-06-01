'use client';
import { motion } from 'framer-motion';
import { Search, FileText, CreditCard, Plane } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: Search,
    title: 'Check Eligibility',
    description: 'Enter your nationality and destination country. We instantly tell you what visa you need and estimated costs.',
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
  },
  {
    step: 2,
    icon: FileText,
    title: 'Fill Application',
    description: 'Complete our smart form with auto-save. Upload documents with drag-and-drop. Takes under 10 minutes.',
    color: 'bg-purple-50 text-purple-600',
    border: 'border-purple-100',
  },
  {
    step: 3,
    icon: CreditCard,
    title: 'Pay Securely',
    description: 'Pay government fees and our service fee in one go. We accept cards, PayPal, and 30+ payment methods.',
    color: 'bg-green-50 text-green-600',
    border: 'border-green-100',
  },
  {
    step: 4,
    icon: Plane,
    title: 'Receive Your Visa',
    description: 'Track your application in real-time. Get email & SMS updates. Your approved visa is delivered digitally.',
    color: 'bg-orange-50 text-orange-600',
    border: 'border-orange-100',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Simple Process</span>
          <h2 className="mt-2 text-4xl font-bold text-gray-900">How VisaFlow Works</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            From eligibility check to visa approval in as little as 24 hours.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 via-green-200 to-orange-200" />

          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative text-center"
            >
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${item.color} border-2 ${item.border} mb-5 relative`}>
                <item.icon className="w-8 h-8" />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-200 rounded-full text-xs font-bold text-gray-600 flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
