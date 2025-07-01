export enum StatusCode {
  // 1xx: Informational
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  EARLY_HINTS = 103,

  // 2xx: Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  MULTI_STATUS = 207,
  ALREADY_REPORTED = 208,
  IM_USED = 226,

  // 3xx: Redirection
  MULTIPLE_CHOICES = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  USE_PROXY = 305,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,

  // 4xx: Client Error
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418,
  MISDIRECTED_REQUEST = 421,
  UNPROCESSABLE_ENTITY = 422,
  LOCKED = 423,
  FAILED_DEPENDENCY = 424,
  TOO_EARLY = 425,
  UPGRADE_REQUIRED = 426,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,

  // 5xx: Server Error
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  VARIANT_ALSO_NEGOTIATES = 506,
  INSUFFICIENT_STORAGE = 507,
  LOOP_DETECTED = 508,
  NOT_EXTENDED = 510,
  NETWORK_AUTHENTICATION_REQUIRED = 511,

  REFRESH_TOKEN_EXPIRED = 4011,
  REFRESH_TOKEN_INVALID = 4012,
  REFRESH_TOKEN_NOT_FOUND = 4013,
  REFRESH_TOKEN_BLACKLISTED = 4015,
  REFRESH_TOKEN_NOT_MATCH = 4016,
}

export class AppError extends Error {
  // response http code
  public readonly resCode: number;
  // status code
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;
  public readonly shouldExit: boolean;
  constructor(
    message: string,
    resCode: number,
    statusCode: number,
    isOperational = true,
    details: Record<string, any> = {},
    shouldExit = false
  ) {
    super(message);
    this.resCode = resCode;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.shouldExit = shouldExit;
    Error.captureStackTrace(this);
  }
}

// Derived error types for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true,
      details
    );
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: Record<string, any>) {
    super(
      message,
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true,
      details
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, StatusCode.UNAUTHORIZED, StatusCode.UNAUTHORIZED, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, StatusCode.FORBIDDEN, StatusCode.FORBIDDEN, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, StatusCode.NOT_FOUND, StatusCode.NOT_FOUND, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, StatusCode.CONFLICT, StatusCode.CONFLICT, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details?: Record<string, any>) {
    super(
      message,
      StatusCode.TOO_MANY_REQUESTS,
      StatusCode.TOO_MANY_REQUESTS,
      true,
      details
    );
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message = 'Service temporarily unavailable',
    details?: Record<string, any>
  ) {
    super(
      message,
      StatusCode.SERVICE_UNAVAILABLE,
      StatusCode.SERVICE_UNAVAILABLE,
      true,
      details
    );
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Bad gateway', details?: Record<string, any>) {
    super(
      message,
      StatusCode.BAD_GATEWAY,
      StatusCode.BAD_GATEWAY,
      true,
      details
    );
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timeout', details?: Record<string, any>) {
    super(
      message,
      StatusCode.REQUEST_TIMEOUT,
      StatusCode.REQUEST_TIMEOUT,
      true,
      details
    );
  }
}

export class RefreshTokenError extends AppError {
  constructor(
    message = 'Refresh token error',
    details?: Record<string, any>,
    resCode: number = StatusCode.BAD_REQUEST,
    statusCode: number = StatusCode.REFRESH_TOKEN_EXPIRED
  ) {
    super(message, resCode, statusCode, true, details);
  }
}
export class RefreshTokenExpiredError extends RefreshTokenError {
  constructor(
    message = 'Refresh token expired',
    details?: Record<string, any>
  ) {
    super(
      message,
      details,
      StatusCode.BAD_REQUEST,
      StatusCode.REFRESH_TOKEN_EXPIRED
    );
  }
}

export class RefreshTokenInvalidError extends RefreshTokenError {
  constructor(
    message = 'Refresh token invalid',
    details?: Record<string, any>
  ) {
    super(
      message,
      details,
      StatusCode.BAD_REQUEST,
      StatusCode.REFRESH_TOKEN_INVALID
    );
  }
}
export class RefreshTokenNotFoundError extends RefreshTokenError {
  constructor(
    message = 'Refresh token not found',
    details?: Record<string, any>
  ) {
    super(
      message,
      details,
      StatusCode.UNAUTHORIZED,
      StatusCode.REFRESH_TOKEN_NOT_FOUND
    );
  }
}
export class RefreshTokenBlacklistedError extends RefreshTokenError {
  constructor(
    message = 'Refresh token blacklisted',
    details?: Record<string, any>
  ) {
    super(
      message,
      details,
      StatusCode.UNAUTHORIZED,
      StatusCode.REFRESH_TOKEN_BLACKLISTED
    );
  }
}
export class RefreshTokenNotMatchError extends RefreshTokenError {
  constructor(
    message = 'Refresh token not match',
    details?: Record<string, any>
  ) {
    super(
      message,
      details,
      StatusCode.UNAUTHORIZED,
      StatusCode.REFRESH_TOKEN_NOT_MATCH
    );
  }
}
