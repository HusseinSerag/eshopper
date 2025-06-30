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
