import './globals.css';

export const metadata = {
  title: 'Smart Traffic AI',
  description: 'AI-Powered Urban Traffic Optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
