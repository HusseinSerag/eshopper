import { PrismaClient } from '@prisma/client';

export class DatabaseProvider {
  private prisma: PrismaClient;

  constructor(url: string) {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  getPrisma() {
    return this.prisma;
  }
}

import type {
  Session,
  Users,
  Avatar,
  AccountType,
  Account as PrismaAccount,
  Role,
  Categories,
  Sellers,
  Shops,
} from '@prisma/client';
type Account = Omit<PrismaAccount, 'password'>;

export type {
  Session,
  Users,
  Avatar,
  AccountType,
  Account,
  Role,
  Categories,
  Sellers as Seller,
  Shops as Shop,
};
