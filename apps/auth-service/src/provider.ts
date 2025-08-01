import { ConfigProvider } from '@eshopper/config-provider';
import { DatabaseProvider } from '@eshopper/database';
import { Redis } from '@eshopper/redis';
import { TokenProvider } from '@eshopper/auth';
import { KafkaProvider } from '@eshopper/kafka';
import { ConfigSchema } from './config/config.schema';

export const config = new ConfigProvider(ConfigSchema);

export const dbProvider = new DatabaseProvider(config.get('DATABASE_URL'));
export const redisProvider = new Redis({
  type: 'url',
  url: config.get('REDIS_URL'),
});

export const tokenProvider = new TokenProvider(
  config.get('ACCESS_TOKEN_SECRET'),
  config.get('REFRESH_TOKEN_SECRET')
);

export const kafkaProvider = new KafkaProvider({
  clientId: config.get('KAFKA_CLIENT_ID'),
  brokers: config.get('KAFKA_BROKERS').split(','),
});
