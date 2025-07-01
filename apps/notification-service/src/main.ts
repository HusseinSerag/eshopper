import { ConfigProvider } from '@eshopper/config-provider';
import { ConfigSchema } from './config/config.schema';
import { KafkaProvider } from '@eshopper/kafka';
import { EmailService } from './services/email.service';
import { NotificationConsumer } from './consumers/notification.consumer';
import { logger } from '@eshopper/logger';

// Initialize configuration
export const config = new ConfigProvider(ConfigSchema);

// Initialize Kafka provider
export const kafkaProvider = new KafkaProvider({
  clientId: config.get('KAFKA_CLIENT_ID'),
  brokers: config.get('KAFKA_BROKERS').split(','),
});

// Initialize email service
export const emailService = new EmailService({
  host: config.get('EMAIL_HOST'),
  port: config.get('EMAIL_PORT'),
  user: config.get('EMAIL_USER'),
  pass: config.get('EMAIL_PASS'),
  from: config.get('EMAIL_FROM'),
  fromName: config.get('EMAIL_FROM_NAME'),
  service: config.get('EMAIL_SERVICE'),
});

// Initialize notification consumer
export const notificationConsumer = new NotificationConsumer(
  kafkaProvider,
  emailService
);

async function startApp() {
  try {
    logger.info('[NOTIFICATION] Starting notification service...');

    // Connect to Kafka
    await kafkaProvider.connect();
    logger.info('[NOTIFICATION] Connected to Kafka');

    // Verify email connection
    const emailConnected = await emailService.verifyConnection();
    if (!emailConnected) {
      throw new Error('Failed to verify email connection');
    }
    logger.info('[NOTIFICATION] Email service verified');

    // Start notification consumer
    await notificationConsumer.start();
    logger.info('[NOTIFICATION] Notification consumer started');

    // Health check endpoint
    const port = config.get('PORT');
    const host = config.get('HOST');

    logger.info(`[NOTIFICATION] Service ready on http://${host}:${port}`);
    logger.info('[NOTIFICATION] Listening for notification messages...');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('\n[NOTIFICATION] Shutting down gracefully...');
      await notificationConsumer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('\n[NOTIFICATION] Shutting down gracefully...');
      await notificationConsumer.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Failed to start service:', { error });
    process.exit(1);
  }
}

// Start the application
startApp().catch((error) => {
  logger.error('[NOTIFICATION] Unhandled error:', { error });
  process.exit(1);
});
