'use client';
import { useState } from 'react';
import { Mail, MapPin, Send } from 'lucide-react';
import { ContentCard, FeatureGrid, PublicPageShell } from '@/components/layout/public-page-shell';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
    toast.success('Message received');
  };

  return (
    <PublicPageShell
      eyebrow="Contact"
      title="Talk to VisaFlow."
      description="Reach our support, partnerships, or press teams. For application-specific help, use dashboard support so your request stays connected to your case."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <ContentCard>
          <div className="space-y-4">
            <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" placeholder="Your name" />
            <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" placeholder="Email address" type="email" />
            <textarea className="min-h-40 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" placeholder="How can we help?" />
            <Button variant="brand" onClick={submit} isLoading={loading} className="gap-2">
              <Send className="h-4 w-4" /> Send message
            </Button>
          </div>
        </ContentCard>
        <FeatureGrid
          items={[
            { title: 'Support', body: 'support@visaflow.com', meta: 'Applicants' },
            { title: 'Press', body: 'press@visaflow.com', meta: 'Media' },
            { title: 'Office', body: 'Remote-first team serving global travelers.', meta: 'Location' },
          ]}
        />
      </div>
    </PublicPageShell>
  );
}
