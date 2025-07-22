import z from 'zod';

const OpeningHourSchema = z.object({
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
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .nullable(),
  close: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .nullable(),
});

export const CreateSellerSchema = z.object({
  body: z.object({
    country: z.string().nonempty({ message: 'Country is required' }),
    shop: z.object({
      name: z.string().nonempty({ message: 'Shop name is required' }),
      bio: z.string().nonempty({ message: 'Shop bio is required' }),
      address: z.string().nonempty({ message: 'Address is required' }),
      opening_hours: z.array(OpeningHourSchema),
      website: z
        .string()
        .url({ message: 'Website must be a valid URL' })
        .nonempty({ message: 'Website is required' }),
      categoryId: z.string().nonempty({ message: 'Category is required' }),
      otherCategory: z.string().optional(),
    }),
  }),
});
