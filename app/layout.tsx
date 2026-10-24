import type { Metadata } from 'next';
import './globals.css';
import { StatusBanners } from '@/components/StatusBanners';

export const metadata: Metadata = {
  title: 'Taranga Tables - Six Strangers. Four Weeks. One Table.',
  description: 'A Taranga project in Mysuru, India. Six strangers. Four weeks. One table, again and again.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-paper-50 text-paper-900 selection:bg-wave-100 selection:text-wave-900">
        <StatusBanners />
        <main className="flex-1 flex flex-col w-full max-w-md mx-auto min-h-[calc(100vh-60px)] px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
