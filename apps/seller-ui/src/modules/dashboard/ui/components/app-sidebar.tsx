'use client';
import { Suspense } from 'react';

import { SidebarSkeleton } from './SidebarSkeleton';
import { SidebarUserMenuContent } from './sidebar';

export function AppSidebar() {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarUserMenuContent />
    </Suspense>
  );
}
