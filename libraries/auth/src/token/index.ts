import { SignOptions } from 'jsonwebtoken';
import { TokenManager } from '../jwt';
import { hashString } from '@eshopper/utils';
import { VerifyOptions } from 'jsonwebtoken';

type TokenType = 'access' | 'refresh';

type TokenGenerationOptions = {
  data: Record<string, any>;
  options: SignOptions;
  type: TokenType;
};

export class TokenProvider {
  private readonly tokenManager: TokenManager;

  private typeToTokenType(type: TokenType) {
    return type === 'refresh' ? 'long' : 'short';
  }
  constructor(secretKey: string, refreshSecretKey: string) {
    this.tokenManager = new TokenManager(secretKey, refreshSecretKey);
  }

  generateToken({ data, options, type }: TokenGenerationOptions) {
    return this.tokenManager.generateToken({
      data,
      options: {
        ...options,
        expiresIn: type === 'refresh' ? '7d' : '10m',
      },
      type: this.typeToTokenType(type),
    });
  }

  async generateTokens({
    data,
    options,
  }: Omit<TokenGenerationOptions, 'type'>) {
    const accessToken = this.generateToken({
      data: {
        userId: data.userId,
        accountId: data.accountId,
      },
      options,
      type: 'access',
    });

    const hashedAccessToken = await hashString(accessToken);
    const refreshToken = this.generateToken({
      data: {
        ...data,
        accessToken: hashedAccessToken,
      },
      options,
      type: 'refresh',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  verifyToken({
    token,
    type,
    options,
  }: {
    token: string;
    type: TokenType;
    options?: VerifyOptions;
  }) {
    return this.tokenManager.verifyToken({
      token,
      type: this.typeToTokenType(type),
      options,
    });
  }
  decodeToken({ token }: { token: string }) {
    return this.tokenManager.decodeToken({
      token,
    });
  }
}
