import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PMap · Bản đồ đô thị thông minh',
  description: 'PMap — báo cáo sự cố đô thị theo thời gian thực và chỉ đường thông minh với AI (OpenStreetMap)',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
