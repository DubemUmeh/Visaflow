import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers';

export const metadata: Metadata = {
  title: {
    default: 'VisaFlow — Your Visa. Simplified.',
    template: '%s | VisaFlow',
  },
  description:
    'Apply for visas online with VisaFlow — the fastest, most trusted way to get your travel documents.',
  keywords: ['visa', 'travel', 'e-visa', 'visa application', 'online visa'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://visaflow.com',
    siteName: 'VisaFlow',
    title: 'VisaFlow — Your Visa. Simplified.',
    description: 'Apply for visas online. Fast, secure, and hassle-free.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VisaFlow — Your Visa. Simplified.',
    description: 'Apply for visas online. Fast, secure, and hassle-free.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
