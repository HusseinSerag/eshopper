export class RequestError extends Error {}
export class NetworkError extends RequestError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class BlockedError extends RequestError {
  constructor() {
    super('User Blocked!');
  }
}
export class AuthError extends RequestError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class TokenRefreshError extends RequestError {
  constructor(message: string) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

export class RequestFailedError extends RequestError {
  constructor(message: string) {
    super(message);
    this.name = 'RequestFailedError';
  }
}
