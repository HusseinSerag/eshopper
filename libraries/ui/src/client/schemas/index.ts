import z from 'zod';

export const NewPasswordSchema = z.object({
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(1, 'Please enter your password'),
  logOutAllDevices: z.boolean({
    required_error: 'Please specify if you want to logout all devices or not!',
  }),
});
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
