import { sign, verify, decode, SignOptions, VerifyOptions } from 'jsonwebtoken';

type TokenGenerationOptions = {
  data: Record<string, any>;
  options: SignOptions;
  type: 'long' | 'short';
};

type TokenVerificationOptions = {
  token: string;
  type: 'long' | 'short';
  options?: VerifyOptions;
};

export class TokenManager {
  private readonly accessSecretKey: string;
  private readonly refreshSecretKey: string;

  constructor(secretKey: string, refreshSecretKey: string) {
    this.accessSecretKey = secretKey;
    this.refreshSecretKey = refreshSecretKey;
  }

  generateToken({ data, options, type }: TokenGenerationOptions) {
    const token = sign(
      data,
      type === 'long' ? this.refreshSecretKey : this.accessSecretKey,
      options
    );
    return token;
  }

  verifyToken({ token, type, options }: TokenVerificationOptions) {
    try {
      verify(
        token,
        type === 'long' ? this.refreshSecretKey : this.accessSecretKey,
        {
          ...options,
        }
      );
      return true;
    } catch {
      return false;
    }
  }
  decodeToken({ token }: Omit<TokenVerificationOptions, 'options' | 'type'>) {
    const decoded = decode(token, {
      json: true,
    });
    return decoded;
  }
}
