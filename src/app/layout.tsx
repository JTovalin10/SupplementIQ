import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import React from 'react';

import { AppStateProvider } from '@/lib/contexts/AppStateContext';
import { ModalProvider } from '@/lib/contexts/ModalContext';
import { UserPreferencesProvider } from '@/lib/contexts/UserPreferencesContext';
import Footer from '../components/layout/footer';
import Header from '../components/layout/header';
import NotificationContainer from '../components/ui/NotificationContainer';

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
  title: 'SupplementIQ - Supplement Database Platform',
  description:
    'Crowdsourced supplement platform with comprehensive product information. Discover real protein content, ingredient details, and make informed supplement choices.',
  keywords:
    'supplements, protein, bioavailability, PDCAAS, DIAAS, nutrition, fitness, database',
  authors: [{ name: 'SupplementIQ Team' }],
  openGraph: {
    title: 'SupplementIQ - Supplement Database Platform',
    description:
      'Discover comprehensive supplement information and make informed choices',
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
        <AppStateProvider>
          <UserPreferencesProvider>
            <ModalProvider>
              <Header />
              <main>{children}</main>
              <Footer />
              <NotificationContainer />
            </ModalProvider>
          </UserPreferencesProvider>
        </AppStateProvider>
      </body>
    </html>
  );
}
