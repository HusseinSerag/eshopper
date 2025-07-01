import { KafkaProvider } from '@eshopper/kafka';
import { EmailService } from '../services/email.service';
import { EachMessagePayload } from 'kafkajs';
import { logger } from '@eshopper/logger';

export interface NotificationMessage {
  type: 'EMAIL' | 'SMS' | 'PUSH';
  channel:
    | 'OTP_VERIFICATION'
    | 'PASSWORD_RESET'
    | 'WELCOME_EMAIL'
    | 'PASSWORD_CHANGED';
  email?: string;
  phone?: string;
  userId?: string;
  otp?: string;
  userName?: string;
  resetUrl?: string;
  data?: Record<string, any>;
}

export class NotificationConsumer {
  private kafkaProvider: KafkaProvider;
  private emailService: EmailService;

  constructor(kafkaProvider: KafkaProvider, emailService: EmailService) {
    this.kafkaProvider = kafkaProvider;
    this.emailService = emailService;
  }

  async start(): Promise<void> {
    try {
      // Subscribe to notifications topic (handles all notification types)
      await this.kafkaProvider.subscribeToTopic(
        {
          groupId: 'notification-service-group',
          topic: 'notifications',
          fromBeginning: false,
        },
        this.handleNotificationMessage.bind(this)
      );

      logger.info('[NOTIFICATION] Consumer started successfully');
    } catch (error) {
      logger.error('[NOTIFICATION] Failed to start consumer:', { error });
      throw error;
    }
  }

  private async handleNotificationMessage(
    payload: EachMessagePayload
  ): Promise<void> {
    try {
      const message = JSON.parse(
        payload.message.value?.toString() || ''
      ) as NotificationMessage;
      logger.info('[NOTIFICATION] Processing message:', {
        message: JSON.stringify(message),
      });

      // Handle by notification type
      switch (message.type) {
        case 'EMAIL':
          await this.handleEmailNotification(message);
          break;
        case 'SMS':
          await this.handleSmsNotification(message);
          break;
        case 'PUSH':
          await this.handlePushNotification(message);
          break;
        default:
          logger.warn('[NOTIFICATION] Unknown notification type:', {
            type: message.type,
          });
      }
    } catch (error) {
      logger.error('[NOTIFICATION] Error processing message:', { error });
      // In a production environment, you might want to send to a dead letter queue
      // or implement retry logic here
    }
  }

  private async handleEmailNotification(
    message: NotificationMessage
  ): Promise<void> {
    if (!message.email) {
      logger.error('[NOTIFICATION] Email missing in message');
      return;
    }

    switch (message.channel) {
      case 'OTP_VERIFICATION':
        await this.handleOtpVerification(message);
        break;
      case 'PASSWORD_RESET':
        await this.handlePasswordReset(message);
        break;
      case 'WELCOME_EMAIL':
        await this.handleWelcomeEmail(message);
        break;
      case 'PASSWORD_CHANGED':
        await this.handlePasswordChanged(message);
        break;
      default:
        logger.warn('[NOTIFICATION] Unknown email channel:', {
          channel: message.channel,
        });
    }
  }

  private async handleSmsNotification(
    message: NotificationMessage
  ): Promise<void> {
    // TODO: Implement SMS service
    logger.info('[NOTIFICATION] SMS notification not implemented yet:', {
      message,
    });
  }

  private async handlePushNotification(
    message: NotificationMessage
  ): Promise<void> {
    // TODO: Implement push notification service
    logger.info('[NOTIFICATION] Push notification not implemented yet:', {
      message,
    });
  }

  private async handlePasswordChanged(
    message: NotificationMessage
  ): Promise<void> {
    if (!message.email) {
      logger.error('[NOTIFICATION] Email missing in message');
      return;
    }
    try {
      await this.emailService.sendPasswordChangedEmail(
        message.email!,
        message.userName
      );
      logger.info(
        `[NOTIFICATION] Password changed email sent successfully to ${message.email}`
      );
    } catch (error) {
      logger.error(
        `[NOTIFICATION] Failed to send password changed email to ${message.email}:`,
        { error }
      );
    }
  }

  private async handleOtpVerification(
    message: NotificationMessage
  ): Promise<void> {
    if (!message.otp) {
      logger.error('[NOTIFICATION] OTP missing in message');
      return;
    }

    try {
      await this.emailService.sendOtpEmail(
        message.email!,
        message.otp,
        message.userName
      );
      logger.info(
        `[NOTIFICATION] OTP email sent successfully to ${message.email}`
      );
    } catch (error) {
      logger.error(
        `[NOTIFICATION] Failed to send OTP email to ${message.email}:`,
        { error: JSON.stringify(error) }
      );
      throw error;
    }
  }

  private async handlePasswordReset(
    message: NotificationMessage
  ): Promise<void> {
    if (!message.resetUrl) {
      logger.error('[NOTIFICATION] Reset token missing in message');
      return;
    }

    try {
      await this.emailService.sendPasswordResetEmail(
        message.email!,
        message.resetUrl,
        message.userName
      );
      logger.info(
        `[NOTIFICATION] Password reset email sent successfully to ${message.email}`
      );
    } catch (error) {
      logger.error(
        `[NOTIFICATION] Failed to send password reset email to ${message.email}:`,
        { error }
      );
      throw error;
    }
  }

  private async handleWelcomeEmail(
    message: NotificationMessage
  ): Promise<void> {
    if (!message.userName) {
      logger.error('[NOTIFICATION] User name missing in welcome email message');
      return;
    }

    try {
      await this.emailService.sendWelcomeEmail(
        message.email!,
        message.userName
      );
      logger.info(
        `[NOTIFICATION] Welcome email sent successfully to ${message.email}`
      );
    } catch (error) {
      logger.error(
        `[NOTIFICATION] Failed to send welcome email to ${message.email}:`,
        { error }
      );
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.kafkaProvider.disconnect();
      logger.info('[NOTIFICATION] Consumer stopped successfully');
    } catch (error) {
      logger.error('[NOTIFICATION] Error stopping consumer:', { error });
    }
  }
}
