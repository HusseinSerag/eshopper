import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { logger } from '@eshopper/logger';
export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  service: string;
}

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private templatesDir: string;

  constructor(config: EmailConfig) {
    this.config = config;

    this.templatesDir = path.resolve(
      'apps/notification-service/dist/templates/emails'
    );

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.pass,
      },
      service: config.service,
    });
  }

  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const templatePath = path.join(
        this.templatesDir,
        `${emailData.template}.ejs`
      );

      logger.info('[EMAIL] Template path:', {
        templatePath,
        exists: fs.existsSync(templatePath),
      });

      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        throw new Error(
          `Email template not found: ${emailData.template} at path: ${templatePath}`
        );
      }

      // Read and compile template
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const html = ejs.render(templateContent, emailData.data);

      // Send email
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Email sent successfully to ${emailData.to}:`, {
        data: info.messageId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(`[EMAIL] Failed to send email to ${emailData.to}:`, {
        error: errorMessage,
        stack: errorStack,
        fullError: error,
      });
      throw error;
    }
  }

  async sendPasswordChangedEmail(to: string, userName?: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Password Changed - eShopper',
      template: 'password-changed',
      data: {
        userName: userName || 'User',
        appName: 'eShopper',
        supportEmail: this.config.from,
      },
    });
  }

  async sendOtpEmail(
    to: string,
    otp: string,
    userName?: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Verify Your Email - eShopper',
      template: 'otp-verification',
      data: {
        otp,
        userName: userName || 'User',
        appName: 'eShopper',
        supportEmail: this.config.from,
      },
    });
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to eShopper!',
      template: 'welcome',
      data: {
        userName,
        appName: 'eShopper',
        supportEmail: this.config.from,
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    userName?: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Reset Your Password - eShopper',
      template: 'reset-password',
      data: {
        resetUrl,
        userName: userName || 'User',
        appName: 'eShopper',
        supportEmail: this.config.from,
      },
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('[EMAIL] SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('[EMAIL] SMTP connection failed:', error);
      return false;
    }
  }
}
