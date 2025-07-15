import { z } from 'zod';

export const SignInSchema = z.object({
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
});
