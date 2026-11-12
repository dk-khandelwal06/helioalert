import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SolarSystemBackground } from '@/components/space/SolarSystemBackground';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'HelioAlert | Explainable Space-Weather Intelligence & Geomagnetic Storm Warning',
  description: 'Will the Sun disturb Earth\'s magnetic field in the next few hours? Scientific early-warning system estimating planetary Kp index reaching 5 or higher using live NOAA SWPC feeds and machine learning.',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col selection:bg-solar-500/30 selection:text-solar-300">
        <ThemeProvider>
          {/* Subtle 3D Animated Space Environment Background */}
          <SolarSystemBackground />

          {/* Navigation Bar */}
          <Navbar />

          {/* Main Application Content Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>

          {/* Educational & Scientific Footer */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
