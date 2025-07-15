import { z } from 'zod';

export const SignUpSchema = z
  .object({
    name: z
      .string({
        required_error: 'Name is required',
      })
      .min(1, 'Name is required'),
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({
        message: 'Please enter a proper email',
      })
      .min(1, 'Email is required'),
    password: z
      .string({
        required_error: 'password is required',
      })
      .min(1, {
        message: 'Please enter a password',
      }),
    confirmPassword: z
      .string({
        required_error: 'confirm password is required',
      })
      .min(1, {
        message: 'Please confirm your password',
      }),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: 'Passwords dont match!',
    path: ['confirmPassword'],
  });
