'use client';
import { useSeller } from '@eshopper/client-auth/client';
import {
  cn,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@eshopper/ui';
import { GalleryVerticalEnd } from 'lucide-react';
import { SidebarLinks } from '../../sidebar-links';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NavUser } from './navUser';
export function SidebarUserMenuContent({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user: data } = useSeller();
  const pathname = usePathname();

  const user = data?.user;
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4 rounded-xl" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                {user?.seller?.shop?.name && (
                  <span className="font-medium">{user.seller.shop.name}</span>
                )}
                {user?.seller?.shop?.address && (
                  <span className="text-sm">{user.seller.shop.address}</span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {SidebarLinks['main'].map((item, index) => (
          <SidebarGroup className="m-0 py-0 px-1" key={index}>
            {item.title && <SidebarGroupLabel>{item.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="px-2 py-0">
                {item.items.map((curr) => (
                  <SidebarMenuItem className="" key={curr.title}>
                    <SidebarMenuButton
                      isActive={pathname === (item.basePath || '') + curr.url}
                      className={cn('p-0 m-0')}
                      asChild
                    >
                      <Link
                        className="flex pl-1 items-center"
                        href={(item.basePath || '') + curr.url}
                      >
                        {<curr.logo className="size-6!" />}
                        <span className="font-semibold">{curr.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
