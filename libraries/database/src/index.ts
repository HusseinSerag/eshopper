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

import type { Session, Users as PrismaUsers, Avatar } from '@prisma/client';
type Users = Omit<PrismaUsers, 'password'>;

export type { Session, Users, Avatar };
