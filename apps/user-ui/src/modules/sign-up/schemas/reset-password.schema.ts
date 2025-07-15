import { z } from 'zod';

export const ResetPasswordSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email({
      message: 'Please enter a proper email',
    })
    .min(1, 'Email is required'),
});
