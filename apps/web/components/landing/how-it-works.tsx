'use client';
import { motion } from 'framer-motion';
import { Search, FileText, CreditCard, Plane } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: Search,
    title: 'Check Eligibility',
    description: 'Enter your nationality and destination country. We instantly tell you what visa you need and estimated costs.',
    color: 'bg-brand-soft text-brand',
    border: 'border-brand-soft',
  },
  {
    step: 2,
    icon: FileText,
    title: 'Fill Application',
    description: 'Complete our smart form with auto-save. Upload documents with drag-and-drop. Takes under 10 minutes.',
    color: 'bg-brand-soft text-brand',
    border: 'border-brand-soft',
  },
  {
    step: 3,
    icon: CreditCard,
    title: 'Pay Securely',
    description: 'Pay government fees and our service fee in one go. We accept cards, PayPal, and 30+ payment methods.',
    color: 'bg-success/10 text-success',
    border: 'border-success/25',
  },
  {
    step: 4,
    icon: Plane,
    title: 'Receive Your Visa',
    description: 'Track your application in real-time. Get email & SMS updates. Your approved visa is delivered digitally.',
    color: 'bg-coral/15 text-coral',
    border: 'border-coral/30',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-sand/45">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-brand uppercase tracking-wider">Simple Process</span>
          <h2 className="mt-2 text-4xl font-bold text-foreground">How VisaFlow Works</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From eligibility check to visa approval in as little as 24 hours.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-0.5 bg-gradient-to-r from-brand-soft via-coral/40 to-success/30" />

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
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-card border-2 border-border rounded-full text-xs font-bold text-muted-foreground flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
