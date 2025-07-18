import { Toaster } from 'sonner';
import './global.css';
import { ClientProviders } from '@/components/client-providers/providers';
import { OfflineAlert } from '@eshopper/ui';

export const metadata = {
  title: 'Eshopper',
  description:
    "Discover a seamless shopping experience with a curated selection of top-quality products, lightning-fast checkout, and real-time order tracking. Whether you're browsing the latest trends, managing your cart, or placing an order — everything is smooth, secure, and just a few clicks away.",
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
