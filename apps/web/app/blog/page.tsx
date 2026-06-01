import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FeatureGrid, PublicPageShell } from '@/components/layout/public-page-shell';

const posts = [
  { title: 'How to prepare a clean passport scan', body: 'A practical checklist for lighting, file size, page edges, and common upload mistakes.', meta: 'Documents' },
  { title: 'Standard, expedited, or rush processing', body: 'How to choose a speed tier without paying for urgency you do not need.', meta: 'Payments' },
  { title: 'What happens after you submit', body: 'A plain-English walkthrough of review, missing document requests, approval, and delivery.', meta: 'Applications' },
];

export default function BlogPage() {
  return (
    <PublicPageShell
      eyebrow="Resources"
      title="Guides for smoother travel documents."
      description="Short, practical articles for preparing stronger applications and understanding the VisaFlow workflow."
    >
      <FeatureGrid items={posts} />
      <Link href="/dashboard/applications/new" className="mt-8 inline-flex items-center gap-2 rounded-full bg-hero px-5 py-3 text-sm font-semibold text-white shadow-card">
        Start an application <ArrowRight className="h-4 w-4" />
      </Link>
    </PublicPageShell>
  );
}
