'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useRouter } from 'next/navigation';

// Common countries for the demo
const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
];

export function EligibilityChecker() {
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const router = useRouter();

  const handleCheck = () => {
    if (!nationality || !destination) return;
    router.push(`/register?from=${nationality}&to=${destination}`);
  };

  return (
    <section id="eligibility" className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Check Your Visa Eligibility
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Instantly find out what visa you need and start your application in under 5 minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card rounded-2xl border border-border shadow-elevated p-8">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  I am from
                </label>
                <Select value={nationality} onValueChange={setNationality}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select nationality..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  I want to visit
                </label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.filter((c) => c.code !== nationality).map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              size="xl"
              variant="brand"
              className="w-full text-base gap-2"
              disabled={!nationality || !destination}
              onClick={handleCheck}
            >
              <Search className="h-4 w-4" />
              Check Eligibility & Apply
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Quick info */}
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              {[
                { icon: CheckCircle2, color: 'text-success', label: 'Instant results' },
                { icon: Info, color: 'text-coral', label: 'All visa types' },
                { icon: CheckCircle2, color: 'text-success', label: 'No signup needed to check' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground bg-sand/45 rounded-lg px-3 py-2">
                  <Icon className={`h-4 w-4 ${color} shrink-0`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
