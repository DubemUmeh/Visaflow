import { ContentCard, FeatureGrid, ProseBlock, PublicPageShell } from '@/components/layout/public-page-shell';

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="Company"
      title="VisaFlow makes travel paperwork feel lighter."
      description="We combine guided applications, document checks, payment tracking, and expert support into one calm workspace for travelers."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ContentCard>
          <ProseBlock>
            <h2>Our Mission</h2>
            <p>
              VisaFlow helps people move through visa requirements with clarity. The product is built around a simple promise: show travelers what is needed, help them submit it correctly, and keep them informed until the document is ready.
            </p>
            <h2>How We Work</h2>
            <p>
              We are not a government agency. We are a travel document platform that organizes requirements, collects applicant information, supports document review, and coordinates the operational work around applications.
            </p>
          </ProseBlock>
        </ContentCard>
        <div className="rounded-2xl bg-hero p-6 text-white shadow-elegant">
          <p className="text-sm uppercase tracking-wide text-white/70">Platform snapshot</p>
          <p className="mt-6 text-4xl font-bold">180+</p>
          <p className="text-white/75">destination workflows supported</p>
          <p className="mt-6 text-4xl font-bold">24/7</p>
          <p className="text-white/75">application support coverage</p>
        </div>
      </div>
      <div className="mt-8">
        <FeatureGrid
          items={[
            { title: 'Traveler first', body: 'Every workflow is designed around clear next steps, readable status, and fewer surprises.' },
            { title: 'Secure by default', body: 'Sensitive documents and identity data are handled with authentication, access controls, and auditability in mind.' },
            { title: 'Built for operators', body: 'Admin review, support, payments, documents, and notifications are part of the same system.' },
          ]}
        />
      </div>
    </PublicPageShell>
  );
}
