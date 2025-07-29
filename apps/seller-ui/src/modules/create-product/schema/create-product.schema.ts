import z from 'zod';
import { MAXIMUM_TAGS } from '../constants';

export const createProductSchema = z.object({
  productImage: z
    .array(
      z.object({
        order: z.number(),
        file: z
          .instanceof(File)
          .refine(
            (file) => file.size <= 5000000,
            'File size must be less than 5MB'
          )
          .refine(
            (file) => file.type.startsWith('image/'),
            'Must be an image file'
          ),
      })
    )
    .min(1, 'Enter atleast 1 image')
    .refine((images) => images.every((img) => img.order !== undefined), {
      message: 'Order is required for all images',
    }),

  name: z
    .string({
      required_error: 'Product name is required',
    })
    .min(1, 'Please enter a product name'),

  description: z
    .string({
      required_error: 'Description is required',
    })
    .min(1, 'Please enter a description')
    .refine((arg) => arg.trim().split(/\s+/).length <= 150, {
      message: 'Description must be at most 150 words',
    }),

  tags: z
    .array(z.string())
    .min(1, 'Enter atleast 1 tag')
    .max(MAXIMUM_TAGS, `Atmost ${MAXIMUM_TAGS} tags are allowed`)
    .refine((tags) => tags.every((tag) => tag.trim().length > 0), {
      message: 'All tags must be filled in',
    }),

  warranty: z
    .object({
      hasWarranty: z.boolean(),
      amount: z.number().min(1).nullable(),
      unit: z.enum(['days', 'weeks', 'months', 'years']).nullable(),
      lifetime: z.boolean(),
    })
    .refine(
      (data) => {
        if (data.hasWarranty && !data.lifetime) {
          return data.amount !== null && data.unit !== null;
        }
        return true;
      },
      {
        message: 'Amount and unit required for non-lifetime warranty',
        path: ['warranty'],
      }
    ),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),

  brand: z
    .string({
      required_error: 'Brand name is required',
    })
    .min(1, 'Please enter a brand name')
    .max(50, 'Maximum 50 characters for a brand names'),

  specifications: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        order: z.number(),
      })
    )
    .min(1, 'Enter atleast 1 specification')
    .refine(
      (specs) =>
        specs.every(
          (spec) =>
            spec.key.trim().length > 0 &&
            spec.value.trim().length > 0 &&
            spec.order !== undefined
        ),
      { message: 'Please fill in all specification keys, and values' }
    ),

  attributes: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, 'Attribute name required'), // User enters: "Color", "Storage", "RAM", whatever
      values: z
        .array(
          z.object({
            id: z.string().optional(),
            value: z.string().min(1, 'Value required'),
            metadata: z.record(z.string()).optional(), // Flexible metadata
            order: z.number(),
          })
        )
        .min(1, 'At least one value required'),
      order: z.number(),
    })
  ),
});
