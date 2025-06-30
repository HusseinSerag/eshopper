import { Redis as redis } from 'ioredis';
import { AppError, StatusCode } from '@eshopper/error-handler';
import { logger } from '@eshopper/logger';
type RedisOptions =
  | {
      host: string;
      port: number;
      password: string;
      username: string;
      db: number;
      type: 'manual';
    }
  | {
      url: string;
      type: 'url';
    };
export class Redis {
  private client: redis;
  private isConnected = false;
  constructor(options: RedisOptions) {
    const retryStrategy = (times: number) => {
      if (times >= 5) return null;
      return Math.min(times * 200, 2000);
    };
    const additionalOptions = {
      retryStrategy,
      lazyConnect: true,
    };

    if (options.type === 'manual') {
      this.client = new redis({
        host: options.host,
        port: options.port,
        password: options.password,
        username: options.username,
        db: options.db,
        ...additionalOptions,
      });
    } else {
      this.client = new redis(options.url, {
        ...additionalOptions,
      });
    }

    this.client.on('error', (error) => {
      logger.error('Redis error', {
        error,
      });
    });
    this.client.on('close', () => {
      if (!this.isConnected) {
        throw new AppError(
          'Redis could not connect after retries, exiting....',
          StatusCode.INTERNAL_SERVER_ERROR,
          StatusCode.INTERNAL_SERVER_ERROR,
          true,
          {},
          true
        );
      }
      this.isConnected = false;
    });
    this.client.on('end', () => {
      if (!this.isConnected) {
        throw new AppError(
          'Redis connection ended before successful connect.',
          StatusCode.INTERNAL_SERVER_ERROR,
          StatusCode.INTERNAL_SERVER_ERROR,
          true,
          {},
          true
        );
      }
    });
  }
  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }
  async set(key: string, value: string) {
    await this.connect();
    await this.client.set(key, value);
  }

  async setTTL(key: string, value: string, ttl: number) {
    await this.connect();
    await this.client.set(key, value, 'EX', ttl);
  }

  async get(key: string) {
    await this.connect();
    return await this.client.get(key);
  }

  async delete(key: string) {
    await this.connect();
    await this.client.del(key);
  }

  async close() {
    if (this.isConnected) {
      await this.client.quit();
    }
  }
}
