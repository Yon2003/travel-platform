import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'ПътуванеБГ - Резервация на автобусни и влакови билети',
  description: 'Резервирай билети за влакове, автобуси и бусове в България',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}