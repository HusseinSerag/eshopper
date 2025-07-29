import { AppSidebar } from '@/modules/dashboard/ui/components/app-sidebar';
import { ProtectedServerComponent } from '@/utils/protectedComponent';
import { SidebarProvider } from '@eshopper/ui';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedServerComponent
      redirection={{
        onBlocked: true,
        onInverification: false,
      }}
      Component={async ({ queryClient }) => {
        return (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <SidebarProvider>
              <div className="max-h-svh h-full flex w-full">
                <AppSidebar />

                <main className="flex-1 py-1  pl-4">{children}</main>
              </div>
            </SidebarProvider>
          </HydrationBoundary>
        );
      }}
    />
  );
}
