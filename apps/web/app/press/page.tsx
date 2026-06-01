import { ContentCard, FeatureGrid, ProseBlock, PublicPageShell } from '@/components/layout/public-page-shell';

export default function PressPage() {
  return (
    <PublicPageShell
      eyebrow="Press"
      title="VisaFlow in the news."
      description="Company background, metrics, and media contact details for stories about travel technology and digital visa workflows."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ContentCard>
          <ProseBlock>
            <h2>Boilerplate</h2>
            <p>
              VisaFlow is a travel document platform helping applicants check requirements, submit visa applications, upload documents, pay fees, and track progress through a modern dashboard.
            </p>
            <h2>Media Contact</h2>
            <p>Email: press@visaflow.com</p>
          </ProseBlock>
        </ContentCard>
        <FeatureGrid
          items={[
            { title: 'Founded', body: 'Built for global travelers and visa operations teams.', meta: 'Company' },
            { title: 'Coverage', body: 'Destination and eligibility workflows across major travel corridors.', meta: 'Product' },
            { title: 'Focus', body: 'Secure, guided application experiences with human support.', meta: 'Mission' },
          ]}
        />
      </div>
    </PublicPageShell>
  );
}
