import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eyes AI CRM',
  description: 'VA Dashboard for Eyes AI',
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