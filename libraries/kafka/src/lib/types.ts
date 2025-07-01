export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

export interface KafkaMessage {
  topic: string;
  key: string;
  value: string;
  headers?: Record<string, string>;
}
