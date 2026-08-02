import './globals.css';

export const metadata = {
  title: 'Smart Traffic AI',
  description: 'AI-Powered Urban Traffic Optimization (OpenStreetMap)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
