import z from 'zod';

export const ResetPasswordSchema = z.object({
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(1, 'Please enter your password'),
  logOutAllDevices: z.boolean({
    required_error: 'Please specify if you want to logout all devices or not!',
  }),
});
