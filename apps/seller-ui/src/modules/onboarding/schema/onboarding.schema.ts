import { countriesList } from '@eshopper/shared-types';
import z from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const CountryCodeSchema = z
  .string({ message: 'Country is required' })
  .toUpperCase()
  .refine((code) => countriesList.some((c) => c.code.toUpperCase() === code), {
    message: 'Invalid country code',
  });

const OpeningHourSchema = z
  .object({
    day: z.enum([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]),
    open: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, {
        message: 'Please enter a proper opening time format!',
      })
      .nullable(),
    close: z
      .string()
      .regex(
        /^\d{2}:\d{2}:\d{2}$/,
        'Please enter a proper opening time format!'
      )
      .nullable(),
  })
  .refine(({ open, close }) => {
    return (open && close) || (!open && !close);
  }, 'Please specify both opening and closing time, or leave both empty to mark this day as closed')
  .refine(({ open, close }) => {
    if (open && close) {
      return open < close;
    }
    return true;
  }, 'Opening time must be before closing time');
export const CreateSellerSchema = z.object({
  country: CountryCodeSchema,

  shop: z
    .object({
      name: z
        .string({
          message: 'shop name is required',
        })
        .nonempty({ message: 'Shop name is required' }),
      bio: z
        .string({ message: 'Shop bio is required' })
        .nonempty({ message: 'Shop bio is required' }),
      address: z
        .string({ message: 'Address is required' })
        .nonempty({ message: 'Address is required' }),
      opening_hours: z.array(OpeningHourSchema),
      website: z
        .string({ message: 'Website must be a valid URL' })
        .url({ message: 'Website must be a valid URL' })
        .nonempty({ message: 'Website is required' }),

      category: z
        .string({ message: 'Category is required' })
        .nonempty({ message: 'Category is required' }),
      otherCategory: z.string().optional(),
    })
    .refine(
      (args) => {
        return !(args.category === 'other' && !args.otherCategory);
      },
      {
        message: 'Please write your custom category',
        path: ['otherCategory'],
      }
    ),
});

export const EnterPhoneNumberSchema = z.object({
  phone_number: z
    .string({ message: 'phone number is required' })
    .refine((val) => {
      const phone = parsePhoneNumberFromString(val);
      return phone?.isValid();
    }, 'Phone number is invalid!'),
});

export const ConfirmPhoneNumberSchema = z.object({
  phone_number: z
    .string({ message: 'phone number is required' })
    .refine((val) => {
      const phone = parsePhoneNumberFromString(val);
      return phone?.isValid();
    }, 'Phone number is invalid!'),
  otp: z
    .string({
      message: 'OTP is required',
    })
    .length(6, 'OTP length must be 6'),
});
