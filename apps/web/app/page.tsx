import { Navbar } from '../components/layout/navbar';
import { Footer } from '../components/layout/footer';
import { Hero } from '../components/landing/hero';
import { EligibilityChecker } from '../components/landing/eligibility-checker';
import { HowItWorks } from '../components/landing/how-it-works';
import { Features } from '../components/landing/features';
import { Testimonials } from '../components/landing/testimonials';
import { CTA } from '../components/landing/cta';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <EligibilityChecker />
        <HowItWorks />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
