import {
  LayoutDashboard,
  Package,
  CreditCard,
  Box,
  PlusCircle,
  Calendar,
  Inbox,
  Settings,
  Bell,
  Percent,
} from 'lucide-react';

export const SidebarLinks = {
  main: [
    {
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          logo: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Main Menu',
      basePath: '/dashboard',

      items: [
        {
          title: 'Orders',
          url: '/orders',
          logo: Package, // Represents shipping box
        },
        {
          title: 'Payment',
          url: '/payment',
          logo: CreditCard, // Credit card is better for payments
        },
      ],
    },

    {
      title: 'Products',
      basePath: '/dashboard',
      items: [
        {
          title: 'All Products',
          url: '/products',
          logo: Box, // Better for displaying multiple products
        },
        {
          title: 'Create Products',
          url: '/create-product',
          logo: PlusCircle, // Represents creation/addition
        },
      ],
    },
    {
      title: 'Events',
      basePath: '/dashboard',
      items: [
        {
          title: 'All Events',
          url: '/events',
          logo: Calendar, // Suitable for events
        },
        {
          title: 'Create Event',
          url: '/create-even',
          logo: PlusCircle,
        },
      ],
    },
    {
      title: 'Controllers',
      basePath: '/dashboard',
      items: [
        {
          title: 'Inbox',
          url: '/inbox',
          logo: Inbox,
        },
        {
          title: 'Settings',
          url: '/settings',
          logo: Settings,
        },
        {
          title: 'Notifications',
          url: '/notifications',
          logo: Bell,
        },
      ],
    },
    {
      title: 'Extras',
      basePath: '/dashboard',
      items: [
        {
          title: 'Discounts',
          url: '/discounts',
          logo: Percent,
        },
      ],
    },
  ],
};
