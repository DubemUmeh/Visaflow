'use client';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Amara Osei',
    country: '🇬🇭 Ghana → 🇨🇦 Canada',
    role: 'Graduate Student',
    rating: 5,
    text: 'I was so nervous about my student visa application. VisaFlow made it incredibly easy. The AI document check caught an issue before I submitted. Approved in 3 days!',
    avatar: 'AO',
    color: 'bg-emerald-500',
  },
  {
    name: 'Kenji Yamamoto',
    country: '🇯🇵 Japan → 🇫🇷 France',
    role: 'Business Executive',
    rating: 5,
    text: 'I use VisaFlow for all my business travel. The rush processing option saved me when I had an urgent Paris meeting. Professional service, every time.',
    avatar: 'KY',
    color: 'bg-blue-500',
  },
  {
    name: 'Priya Sharma',
    country: '🇮🇳 India → 🇦🇪 UAE',
    role: 'Software Engineer',
    rating: 5,
    text: 'Compared to the traditional process, VisaFlow is night and day. No paperwork, no embassy visits. Just fill, upload, pay, and wait for the email.',
    avatar: 'PS',
    color: 'bg-purple-500',
  },
  {
    name: 'Carlos Mendez',
    country: '🇲🇽 Mexico → 🇬🇧 UK',
    role: 'Digital Nomad',
    rating: 5,
    text: 'As someone who travels constantly, I need reliability. VisaFlow has never let me down. The real-time tracking is fantastic — I always know exactly where my application stands.',
    avatar: 'CM',
    color: 'bg-orange-500',
  },
  {
    name: 'Fatima Al-Rashid',
    country: '🇸🇦 Saudi Arabia → 🇺🇸 USA',
    role: 'Medical Professional',
    rating: 5,
    text: 'The support team helped me navigate the complex US visa requirements. They responded within minutes. My visa was approved and I made it to my conference!',
    avatar: 'FA',
    color: 'bg-rose-500',
  },
  {
    name: 'David Kimani',
    country: '🇰🇪 Kenya → 🇩🇪 Germany',
    role: 'Tech Entrepreneur',
    rating: 5,
    text: 'I was skeptical at first, but VisaFlow delivered. The application took 12 minutes, documents were verified immediately, and I had my Schengen visa within 4 days.',
    avatar: 'DK',
    color: 'bg-cyan-500',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Trusted by Travelers</span>
          <h2 className="mt-2 text-4xl font-bold text-gray-900">
            Real Stories from Real Travelers
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join 500,000+ happy travelers who've trusted VisaFlow
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card hover:shadow-soft transition-shadow"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                  <p className="text-xs text-gray-400">{t.country}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
