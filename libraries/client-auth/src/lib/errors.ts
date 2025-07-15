export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class BlockedError extends Error {
  constructor() {
    super('User Blocked!');
  }
}
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class TokenRefreshError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

export class RequestFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestFailedError';
  }
}
