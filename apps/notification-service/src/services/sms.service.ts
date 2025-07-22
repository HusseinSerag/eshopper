import twilio, { Twilio } from 'twilio';
import { config } from '../main';
import { logger } from '@eshopper/logger';

interface SMSOptions {
  to: string;
  body: string;
}
interface SMSConfig {
  phone_number: string;
}
export class SMSService {
  client: Twilio;
  sms_config: SMSConfig;
  constructor() {
    this.client = twilio(
      config.get('TWILIO_ACCOUNT_SID'),
      config.get('TWILIO_AUTH_TOKEN')
    );
    this.sms_config = {
      phone_number: config.get('PHONE_NUMBER'),
    };
  }

  async sendSMS({ body, to }: SMSOptions) {
    try {
      logger.info(`[SMS] Sending SMS`);
      await this.client.messages.create({
        body,
        from: this.sms_config.phone_number,
        to,
      });
      logger.info('[SMS] SMS sent');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(`[SMS] Failed to send sms to :`, {
        error: errorMessage,
        stack: errorStack,
        fullError: error,
      });
      throw error;
    }
  }
}
