import { Toaster } from 'sonner';
import { ClientProviders } from './components/providers/providers';
import './global.css';
import { OfflineAlert } from '@eshopper/ui';

export const metadata = {
  title: 'Welcome to seller-ui',
  description: 'Generated by create-nx-workspace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProviders>
      <html className="min-h-svh w-full" lang="en">
        <body className="min-h-svh w-full">
          {children}

          <Toaster />
          <OfflineAlert />
        </body>
      </html>
    </ClientProviders>
  );
}
