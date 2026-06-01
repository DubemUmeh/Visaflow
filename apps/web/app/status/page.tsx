import { CheckCircle2, Clock } from 'lucide-react';
import { ContentCard, PublicPageShell } from '@/components/layout/public-page-shell';

const services = [
  ['API', 'Operational'],
  ['Application submissions', 'Operational'],
  ['Document uploads', 'Operational'],
  ['Payments', 'Operational'],
  ['Notifications', 'Operational'],
  ['AI assistance', 'Operational'],
] as const;

export default function StatusPage() {
  return (
    <PublicPageShell
      eyebrow="System Status"
      title="VisaFlow systems are operational."
      description="A quick status overview for application, payment, document, notification, and AI services."
    >
      <ContentCard>
        <div className="space-y-3">
          {services.map(([name, status]) => (
            <div key={name} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-gray-900">{name}</span>
              </div>
              <span className="text-sm text-emerald-700">{status}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" /> Last checked just now.
        </p>
      </ContentCard>
    </PublicPageShell>
  );
}
