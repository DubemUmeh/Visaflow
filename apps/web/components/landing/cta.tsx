'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Globe2 } from 'lucide-react';
import { Button } from '../ui/button';

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-brand opacity-95" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-card/10 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-card/10 rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card/20 mb-6">
            <Globe2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to Travel the World?
          </h2>
          <p className="text-xl text-brand-foreground/80 mb-8 max-w-2xl mx-auto">
            Join 500,000+ travelers who get their visas with VisaFlow. Start your application today — it only takes 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="xl" className="bg-card text-brand hover:bg-brand-soft shadow-elegant w-full sm:w-auto gap-2">
                Start Free Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#eligibility">
              <Button size="xl" variant="outline" className="border-white/40 bg-accent/70 text-white hover:bg-card/10 w-full sm:w-auto">
                Check Eligibility First
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-brand-foreground/70 text-sm">
            No credit card required to check eligibility · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
