import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import React from 'react';

import { AppProvider } from '@/lib/contexts/AppContext';
import Footer from '../components/layout/footer';
import Header from '../components/layout/header';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SupplementIQ - Transparency Engine for Supplements',
  description:
    'Crowdsourced supplement transparency platform with bioavailability calculations. Discover real protein content, transparency scores, and cost efficiency.',
  keywords:
    'supplements, transparency, protein, bioavailability, PDCAAS, DIAAS, nutrition, fitness',
  authors: [{ name: 'SupplementIQ Team' }],
  openGraph: {
    title: 'SupplementIQ - Transparency Engine for Supplements',
    description:
      'Discover the real protein content and transparency of your supplements',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
