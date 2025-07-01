import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
/**
 * @openapi
 * /resend-verification-email:
 *   post:
 *     summary: Resend verification email
 *     tags: [Email Verification]
 *     responses:
 *       200:
 *         description: OTP resent successfully
 */
/**
 * @openapi
 * /me:
 *   get:
 *     summary: Get current user info (requires authentication)
 *     tags: [User Profile]
 *     responses:
 *       200:
 *         description: Returns user info and OTP cooldown
 */
/**
 * @openapi
 * /verify-email:
 *   post:
 *     summary: Verify user email with OTP
 *     tags: [Email Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailSchema'
 *     responses:
 *       200:
 *         description: Email verified successfully
 */

/**
 * @openapi
 * /reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordSchema'
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
/**
 * @openapi
 * /reset-password-request:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequestSchema'
 *     responses:
 *       200:
 *         description: Reset password instructions sent if email exists
 */

/**
 * @openapi
 * /refresh:
 *   post:
 *     summary: Refresh authentication tokens
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 */

/**
 * @openapi
 * /logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout from all devices successful
 */

/**
 * @openapi
 * /logout:
 *   post:
 *     summary: Logout from the application
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Login to the application
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUserSchema'
 *     responses:
 *       200:
 *         description: Login successful
 */

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserSchema'
 *     responses:
 *       201:
 *         description: User registered successfully
 */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'Authentication service endpoints',
    },
    servers: [{ url: '/auth' }],
    components: {
      schemas: {
        RegisterUserSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'password123',
            },
          },
          required: ['email', 'password'],
        },
        LoginUserSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'password123',
            },
          },
          required: ['email', 'password'],
        },
        ResetPasswordRequestSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
          },
          required: ['email'],
        },
        ResetPasswordSchema: {
          type: 'object',
          properties: {
            password: {
              type: 'string',
              minLength: 8,
              example: 'newpassword123',
            },
            logOutAllDevices: { type: 'boolean', example: true },
          },
          required: ['password', 'logOutAllDevices'],
        },
        VerifyEmailSchema: {
          type: 'object',
          properties: {
            otp: {
              type: 'string',
              minLength: 6,
              maxLength: 6,
              example: '123456',
            },
          },
          required: ['otp'],
        },
      },
    },
  },
  // Multiple approaches to try:
  apis: [
    __filename, // Current file
    path.join(__dirname, '*.ts'), // All TS files in current dir
    path.join(__dirname, '**/*.ts'), // All TS files recursively
    path.join(__dirname, '**/*.routes.ts'), // All TS files recursively
  ],
});

// Debug: Log the generated spec to see what's being picked up
console.log(
  'Generated Swagger spec paths:',
  Object.keys((swaggerSpec as any).paths || {})
);
console.log('Generated Swagger spec:', JSON.stringify(swaggerSpec, null, 2));

export default swaggerSpec;
