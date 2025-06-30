import winston from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export interface LogMeta {
  [key: string]: any;
}

export interface LoggerInterface {
  error(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  verbose(message: string, meta?: LogMeta): void;
  child(meta: LogMeta): LoggerInterface;
  addContext(context: LogMeta): void;
  clearContext(): void;
}

class Logger implements LoggerInterface {
  private logger: winston.Logger;
  private static instance: Logger;

  private constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    const logLevel =
      process.env.LOG_LEVEL || (isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Define console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length
          ? ` ${JSON.stringify(meta, null, 2)}`
          : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    );

    // Create transports
    const transports: winston.transport[] = [];

    // Console transport
    if (isDevelopment) {
      transports.push(
        new winston.transports.Console({
          format: consoleFormat,
          level: logLevel,
        })
      );
    } else {
      transports.push(
        new winston.transports.Console({
          format: logFormat,
          level: logLevel,
        })
      );
    }

    // File transports for production
    if (isProduction) {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: LogLevel.ERROR,
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );

      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }

    // Create logger instance
    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: isProduction,
      // Handle uncaught exceptions and rejections
      exceptionHandlers: isProduction
        ? [new winston.transports.File({ filename: 'logs/exceptions.log' })]
        : [],
      rejectionHandlers: isProduction
        ? [new winston.transports.File({ filename: 'logs/rejections.log' })]
        : [],
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public error(message: string, meta?: LogMeta): void {
    this.logger.error(message, meta);
  }

  public warn(message: string, meta?: LogMeta): void {
    this.logger.warn(message, meta);
  }

  public info(message: string, meta?: LogMeta): void {
    this.logger.info(message, meta);
  }

  public debug(message: string, meta?: LogMeta): void {
    this.logger.debug(message, meta);
  }

  public verbose(message: string, meta?: LogMeta): void {
    this.logger.verbose(message, meta);
  }

  // Method to create child logger with additional context
  public child(meta: LogMeta): LoggerInterface {
    const childLogger = this.logger.child(meta);

    return {
      error: (message: string, childMeta?: LogMeta) =>
        childLogger.error(message, childMeta),
      warn: (message: string, childMeta?: LogMeta) =>
        childLogger.warn(message, childMeta),
      info: (message: string, childMeta?: LogMeta) =>
        childLogger.info(message, childMeta),
      debug: (message: string, childMeta?: LogMeta) =>
        childLogger.debug(message, childMeta),
      verbose: (message: string, childMeta?: LogMeta) =>
        childLogger.verbose(message, childMeta),
      child: (childMeta: LogMeta) => this.child(childMeta),
      addContext: (context: LogMeta) => this.addContext(context),
      clearContext: () => this.clearContext(),
    };
  }

  // Method to add context to all subsequent logs
  public addContext(context: LogMeta): void {
    this.logger.defaultMeta = { ...this.logger.defaultMeta, ...context };
  }

  // Method to clear context
  public clearContext(): void {
    this.logger.defaultMeta = {};
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export Logger class for testing
export { Logger };
