import { parsePhoneNumberFromString } from 'libphonenumber-js';
import z from 'zod';
export const EnterPhoneNumberSchema = z.object({
  body: z.object({
    phone_number: z
      .string({ message: 'phone number is required' })
      .refine((val) => {
        const phone = parsePhoneNumberFromString(val);
        return phone?.isValid();
      }, 'Phone number is invalid!'),
  }),
});

export const ConfirmOTPSchema = z.object({
  body: z.object({
    otp: z
      .string({
        required_error: 'OTP is required',
      })
      .length(6, {
        message: 'OTP must be 6 digits',
      }),
    phone_number: z
      .string({ message: 'phone number is required' })
      .refine((val) => {
        const phone = parsePhoneNumberFromString(val);
        return phone?.isValid();
      }, 'Phone number is invalid!'),
  }),
});
