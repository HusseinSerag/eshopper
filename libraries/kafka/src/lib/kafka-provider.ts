import {
  Kafka,
  Producer,
  Consumer,
  KafkaConfig as KafkaJsConfig,
  EachMessagePayload,
  EachBatchPayload,
} from 'kafkajs';
import { KafkaConfig, KafkaMessage } from './types';

interface ConsumerConfig {
  groupId: string;
  topic: string;
  fromBeginning?: boolean;
}

export class KafkaProvider {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected = false;
  private clientId: string;

  constructor(config: KafkaConfig) {
    const kafkaConfig: KafkaJsConfig = {
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      sasl: config.sasl as any, // Type assertion for SASL config
    };

    this.kafka = new Kafka(kafkaConfig);
    this.clientId = config.clientId;
  }

  async connect() {
    if (this.isConnected) {
      console.log('[KAFKA] Already connected');
      return;
    }

    try {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.isConnected = true;
      console.log(`[KAFKA] Producer connected for ${this.clientId}`);
    } catch (error) {
      console.error('[KAFKA] Failed to connect producer:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }

      // Disconnect all consumers
      const disconnectPromises = Array.from(this.consumers.values()).map(
        async (consumer) => {
          try {
            await consumer.disconnect();
          } catch (error) {
            console.error('[KAFKA] Error disconnecting consumer:', error);
          }
        }
      );

      await Promise.all(disconnectPromises);
      this.consumers.clear();
      this.isConnected = false;

      console.log(`[KAFKA] Disconnected from ${this.clientId}`);
    } catch (error) {
      console.error('[KAFKA] Error during disconnect:', error);
      throw error;
    }
  }

  getProducer(): Producer {
    if (!this.producer || !this.isConnected) {
      throw new Error('Producer not connected. Call connect() first.');
    }
    return this.producer;
  }

  async getConsumer(groupId: string): Promise<Consumer> {
    if (this.consumers.has(groupId)) {
      return this.consumers.get(groupId)!;
    }

    const consumer = this.kafka.consumer({ groupId });
    this.consumers.set(groupId, consumer);

    try {
      await consumer.connect();
      console.log(`[KAFKA] Consumer connected for group: ${groupId}`);
    } catch (error) {
      this.consumers.delete(groupId);
      console.error(
        `[KAFKA] Failed to connect consumer for group ${groupId}:`,
        error
      );
      throw error;
    }

    return consumer;
  }

  async sendMessage(message: KafkaMessage): Promise<void> {
    try {
      const producer = this.getProducer();
      await producer.send({
        topic: message.topic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers: message.headers,
          },
        ],
      });
      console.log(`[KAFKA] Message sent to topic: ${message.topic}`);
    } catch (error) {
      console.error(
        `[KAFKA] Failed to send message to topic ${message.topic}:`,
        error
      );
      throw error;
    }
  }

  async subscribeToTopic(
    config: ConsumerConfig,
    messageHandler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    try {
      const consumer = await this.getConsumer(config.groupId);

      await consumer.subscribe({
        topic: config.topic,
        fromBeginning: config.fromBeginning || false,
      });

      await consumer.run({
        eachMessage: messageHandler,
      });

      console.log(
        `[KAFKA] Subscribed to topic: ${config.topic} with group: ${config.groupId}`
      );
    } catch (error) {
      console.error(
        `[KAFKA] Failed to subscribe to topic ${config.topic}:`,
        error
      );
      throw error;
    }
  }

  async subscribeToBatch(
    config: ConsumerConfig,
    batchHandler: (payload: EachBatchPayload) => Promise<void>
  ): Promise<void> {
    try {
      const consumer = await this.getConsumer(config.groupId);

      await consumer.subscribe({
        topic: config.topic,
        fromBeginning: config.fromBeginning || false,
      });

      await consumer.run({
        eachBatch: batchHandler,
      });

      console.log(
        `[KAFKA] Subscribed to batch topic: ${config.topic} with group: ${config.groupId}`
      );
    } catch (error) {
      console.error(
        `[KAFKA] Failed to subscribe to batch topic ${config.topic}:`,
        error
      );
      throw error;
    }
  }

  isConnectedToKafka(): boolean {
    return this.isConnected;
  }

  getConnectedConsumers(): string[] {
    return Array.from(this.consumers.keys());
  }
}
