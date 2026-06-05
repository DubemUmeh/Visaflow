'use client';
import { motion } from 'framer-motion';
import {
  Zap, Shield, Bell, FileCheck, CreditCard, HeadphonesIcon,
  Globe, BarChart3, RefreshCw,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Most applications processed within 24 hours. Expedited and rush options available.',
    color: 'text-warning bg-warning/10',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: '256-bit SSL encryption. SOC 2 Type II certified. Your data is safe with us.',
    color: 'text-coral bg-brand-soft',
  },
  {
    icon: Bell,
    title: 'Real-Time Tracking',
    description: 'Track every stage of your application. Email, SMS, and in-app notifications.',
    color: 'text-brand bg-brand-soft',
  },
  {
    icon: FileCheck,
    title: 'AI Document Check',
    description: 'Our AI reviews your documents before submission, catching errors instantly.',
    color: 'text-success bg-success/10',
  },
  {
    icon: CreditCard,
    title: 'Flexible Payments',
    description: 'Pay with Visa, Mastercard, PayPal, or 30+ local payment methods.',
    color: 'text-brand bg-brand-soft',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Expert Support',
    description: 'Our visa specialists are available around the clock to help you.',
    color: 'text-destructive bg-destructive/10',
  },
  {
    icon: Globe,
    title: '180+ Countries',
    description: 'We cover tourist, business, student, and medical visas for 180+ countries.',
    color: 'text-brand bg-brand-soft',
  },
  {
    icon: BarChart3,
    title: 'Success Analytics',
    description: 'See approval rates, processing times, and tips for your specific route.',
    color: 'text-coral bg-coral/15',
  },
  {
    icon: RefreshCw,
    title: 'Auto-Renewal Alerts',
    description: 'Get reminders before your visa expires. Never overstay accidentally.',
    color: 'text-success bg-success/10',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-brand uppercase tracking-wider">Everything You Need</span>
          <h2 className="mt-2 text-4xl font-bold text-foreground">
            Built for Modern Travelers
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We've thought of everything so you don't have to. From AI document scanning to real-time embassy updates.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group p-6 rounded-2xl border border-border/70 hover:border-brand-soft hover:shadow-soft transition-all duration-200 cursor-default"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
