import type { NextFunction, Request, Response } from 'express';
import { AppError, StatusCode, NotFoundError } from './appError';
import { logger } from '@eshopper/logger';

// Error response interface for consistent formatting
interface ErrorResponse {
  isError: boolean;
  status: number;
  message: string;
  data?: Record<string, any>;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
}

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
//const isProduction = process.env.NODE_ENV === 'production';

// Error handler configuration
interface ErrorHandlerConfig {
  includeStackInResponse?: boolean;
  logUnhandledErrors?: boolean;
  requestIdHeader?: string;
}

// Main error handler middleware
export function ErrorHandlerMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
  config: ErrorHandlerConfig = {}
) {
  const {
    includeStackInResponse = isDevelopment,
    logUnhandledErrors = true,
    requestIdHeader = 'x-request-id',
  } = config;

  // Extract request ID for tracing
  const requestId =
    (req.headers[requestIdHeader] as string) ||
    (req.headers['x-correlation-id'] as string) ||
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create base error response
  const errorResponse: ErrorResponse = {
    isError: true,
    status: StatusCode.INTERNAL_SERVER_ERROR,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    requestId,
  };

  // Handle different types of errors
  if (error instanceof AppError) {
    if (error.shouldExit) {
      // send a sigint signal to the process
      process.kill(process.pid, 'SIGINT');
      return;
    }
    // Handle operational errors (expected errors)
    errorResponse.status = error.resCode;
    errorResponse.message = error.message;

    if (error.details && Object.keys(error.details).length > 0) {
      errorResponse.data = error.details;
    }

    // Log operational errors at info level
    logger.info('Operational error handled', {
      requestId,
      path: req.path,
      method: req.method,
      statusCode: error.resCode,
      message: error.message,
      details: error.details,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    });
  } else if (error.name === 'ValidationError') {
    // Handle Mongoose validation errors
    errorResponse.status = StatusCode.BAD_REQUEST;
    errorResponse.message = 'Validation Error';
    errorResponse.data = { validationErrors: (error as any).errors };

    logger.warn('Validation error', {
      requestId,
      path: req.path,
      method: req.method,
      validationErrors: (error as any).errors,
    });
  } else if (error.name === 'CastError') {
    // Handle Mongoose cast errors (invalid ObjectId, etc.)
    errorResponse.status = StatusCode.BAD_REQUEST;
    errorResponse.message = 'Invalid ID format';

    logger.warn('Cast error', {
      requestId,
      path: req.path,
      method: req.method,
      castError: error.message,
    });
  } else if (error.name === 'JsonWebTokenError') {
    // Handle JWT errors
    errorResponse.status = StatusCode.UNAUTHORIZED;
    errorResponse.message = 'Invalid token';

    logger.warn('JWT error', {
      requestId,
      path: req.path,
      method: req.method,
      jwtError: error.message,
    });
  } else if (error.name === 'TokenExpiredError') {
    // Handle expired JWT tokens
    errorResponse.status = StatusCode.UNAUTHORIZED;
    errorResponse.message = 'Token expired';

    logger.warn('Token expired', {
      requestId,
      path: req.path,
      method: req.method,
    });
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    // Handle JSON parsing errors
    errorResponse.status = StatusCode.BAD_REQUEST;
    errorResponse.message = 'Invalid JSON format';

    logger.warn('JSON parsing error', {
      requestId,
      path: req.path,
      method: req.method,
    });
  } else {
    // Handle unexpected errors (non-operational)
    if (logUnhandledErrors) {
      logger.error('Unhandled error occurred', {
        requestId,
        path: req.path,
        method: req.method,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
      });
    }

    // In development, include more details
    if (isDevelopment) {
      errorResponse.message = error.message;
      errorResponse.data = {
        name: error.name,
        stack: error.stack,
      };
    }
  }

  // Include stack trace in development
  if (includeStackInResponse && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(errorResponse.status).json(errorResponse);

  // Call next to continue middleware chain (important for Express)
  next();
}

// Async error wrapper for route handlers
export function asyncErrorHandler<T extends any[]>(
  fn: (
    req: Request,
    res: Response,
    next: NextFunction,
    ...args: T
  ) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction, ...args: T) => {
    Promise.resolve(fn(req, res, next, ...args)).catch(next);
  };
}

// 404 handler for unmatched routes
export function NotFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}

// Graceful shutdown handler
export function GracefulShutdownHandler(
  signal: string,
  server: any,
  cleanupResources: () => void
) {
  return () => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    cleanupResources();
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
}

// Error monitoring and alerting (placeholder for production monitoring services)

export function setupErrorMonitoring(cleanupResources: () => void) {
  process.on('uncaughtException', (error: Error) => {
    cleanupResources();
    logger.error('Uncaught Exception', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });

    // In production, you might want to send this to a monitoring service
    // like Sentry, DataDog, or New Relic

    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    cleanupResources();
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      promise: promise.toString(),
    });

    // In production, you might want to send this to a monitoring service
    process.exit(1);
  });
}
