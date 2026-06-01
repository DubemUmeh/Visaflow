'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Clock,
  Star,
  Globe2,
  Languages,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';

const stats = [
  { label: 'Visas Processed', value: '500K+' },
  { label: 'Countries Covered', value: '180+' },
  { label: 'Approval Rate', value: '99.2%' },
  { label: 'Avg. Processing', value: '3.2d' },
];

const trustBadges = [
  { icon: Shield, label: 'Bank-grade security' },
  { icon: Clock, label: '24/7 expert support' },
  { icon: Star, label: '4.9/5 rating' },
  { icon: Globe2, label: '180+ countries' },
  { icon: Languages, label: '14 languages' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-sunrise pt-16">
      <div className="absolute inset-0 bg-mesh opacity-80" aria-hidden />

      <div className="container-page relative grid gap-12 pb-24 pt-14 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white/75 px-4 py-1.5 text-sm font-medium text-gray-600 shadow-card backdrop-blur lg:mx-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            New: AI-assisted application in minutes
          </motion.div>

          <h1 className="text-5xl font-bold leading-tight text-gray-950 sm:text-6xl lg:text-7xl">
            Travel anywhere. <br />
            <span className="gradient-text">We handle the visa.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600 lg:mx-0">
            Check requirements, prepare documents, submit your application, and track every update in one trusted place.
          </p>

          <div className="mb-10 mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/register">
              <Button size="xl" variant="brand" className="w-full gap-2 sm:w-auto">
                Start Your Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button size="xl" variant="outline" className="w-full bg-white/70 sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-sm text-gray-500">
                <Icon className="h-4 w-4 text-orange-500" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl shadow-elegant ring-1 ring-gray-200">
            <img
              src="/images/hero-skyline.jpg"
              alt="Sunrise coastline seen from an airplane window"
              className="h-[420px] w-full object-cover sm:h-[520px]"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/85 p-4 shadow-card backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Avg. approval</p>
                  <p className="text-2xl font-bold text-gray-950">3.2 days</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-gray-500">Approval rate</p>
                  <p className="text-2xl font-bold text-emerald-600">99.2%</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -top-4 hidden rounded-2xl bg-white p-4 shadow-card ring-1 ring-gray-200 lg:block">
            <p className="text-xs text-gray-500">Last approval</p>
            <p className="font-medium">France to Japan - 2 min ago</p>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container-page">
          <div className="grid grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
            {stats.map(({ label, value }) => (
              <div key={label} className="px-6 py-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
