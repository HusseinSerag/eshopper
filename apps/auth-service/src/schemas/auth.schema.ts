import { z } from 'zod';

export const RegisterUserSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({
        message: 'Invalid email address',
      }),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(8, {
        message: 'Password must be at least 8 characters long',
      }),
  }),
});

export const LoginUserSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({
        message: 'Invalid email address',
      }),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(8, {
        message: 'Password must be at least 8 characters long',
      }),
  }),
});

export const VerifyEmailSchema = z.object({
  body: z.object({
    otp: z
      .string({
        required_error: 'OTP is required',
      })
      .length(6, {
        message: 'OTP must be 6 digits',
      }),
  }),
});

export const ResetPasswordRequestSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({
        message: 'Invalid email address',
      }),
  }),
});

export const ResetPasswordSchema = z.object({
  body: z.object({
    password: z.string({
      required_error: 'Password is required',
    }),
    logOutAllDevices: z.boolean({
      required_error:
        'Please specify if you want to logout all devices or not!',
    }),
  }),
  query: z.object({
    token: z.string({
      required_error: 'Token is required',
    }),
  }),
});
