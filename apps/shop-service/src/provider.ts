import { ConfigProvider } from '@eshopper/config-provider';
import { DatabaseProvider } from '@eshopper/database';
import { Redis } from '@eshopper/redis';
import { KafkaProvider } from '@eshopper/kafka';
import { ConfigSchema } from './config/config.schema';
import { TokenProvider } from '@eshopper/auth';
import { StripeClient } from '@eshopper/utils';

export class Provider {
  config = new ConfigProvider(ConfigSchema);
  dbProvider = new DatabaseProvider(this.config.get('DATABASE_URL'));
  redisProvider = new Redis({
    type: 'url',
    url: this.config.get('REDIS_URL'),
  });
  kafkaProvider = new KafkaProvider({
    clientId: this.config.get('KAFKA_CLIENT_ID'),
    brokers: this.config.get('KAFKA_BROKERS').split(','),
  });
  tokenProvider = new TokenProvider(
    this.config.get('ACCESS_TOKEN_SECRET'),
    this.config.get('REFRESH_TOKEN_SECRET')
  );

  stripeClient = new StripeClient(this.config.get('STRIPE_SECRET_KEY'));
}

const provider = new Provider();
export const config = provider.config;
export const kafkaProvider = provider.kafkaProvider;
export const tokenProvider = provider.tokenProvider;
export const stripeClient = provider.stripeClient;
export const redisProvider = provider.redisProvider;
export const dbProvider = provider.dbProvider;
