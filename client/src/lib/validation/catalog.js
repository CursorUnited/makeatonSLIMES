import { z } from 'zod';
import { emailSchema } from './auth';

const nameSchema = z.string().trim().min(1, 'Enter a name.').max(120, 'Keep it under 120 characters.');

const moneySchema = z
  .string()
  .trim()
  .min(1, 'Enter an amount of 0 or more, with up to 2 decimals.')
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount of 0 or more, with up to 2 decimals.');

const idSchema = z.union([z.string(), z.number()]);

// AD-3 Taxes
export const taxSchema = z
  .object({
    name: nameSchema,
    type: z.enum(['PERCENT', 'FIXED']),
    rate: z
      .string()
      .trim()
      .min(1, 'Enter a rate between 0 and 100.')
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter a rate between 0 and 100.'),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.type !== 'PERCENT' || Number(v.rate) <= 100, {
    message: 'Enter a rate between 0 and 100.',
    path: ['rate'],
  });

// AD-4 Payment terms
export const paymentTermSchema = z.object({
  name: nameSchema,
  dueDays: z.coerce
    .number({ invalid_type_error: 'Enter a whole number of days.' })
    .int('Enter a whole number of days.')
    .min(0, 'Due days must be between 0 and 365.')
    .max(365, 'Due days must be between 0 and 365.'),
});

// AD-1 Products
export const productSchema = z.object({
  name: nameSchema,
  type: z.enum(['SERVICE', 'GOODS']),
  salesPrice: moneySchema,
  costPrice: moneySchema,
  notes: z.string().trim().max(2000, 'Keep it under 2000 characters.').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  taxIds: z.array(idSchema).optional(),
});

export const variantSchema = z.object({
  attribute: nameSchema,
  value: nameSchema,
  extraPrice: z
    .string()
    .trim()
    .min(1, "Extra price can't be negative.")
    .regex(/^\d+(\.\d{1,2})?$/, "Extra price can't be negative."),
});

// AD-2 Plans
export const planSchema = z
  .object({
    name: nameSchema,
    price: moneySchema,
    billingPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    taxIds: z.array(idSchema).optional(),
    minQuantity: z.coerce
      .number({ invalid_type_error: 'Minimum quantity must be at least 1.' })
      .int('Minimum quantity must be at least 1.')
      .min(1, 'Minimum quantity must be at least 1.'),
    startDate: z.string().min(1, 'Choose a start date.'),
    endDate: z.string().optional().or(z.literal('')),
    autoClose: z.boolean().optional(),
    closable: z.boolean().optional(),
    pausable: z.boolean().optional(),
    renewable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => !v.endDate || !v.startDate || v.endDate >= v.startDate, {
    message: 'End date must be on or after the start date.',
    path: ['endDate'],
  });

// AD-5 Quotation templates
export const templateLineSchema = z.object({
  productId: idSchema.refine((v) => Boolean(v), 'Choose a product.'),
  variantId: z.union([z.string(), z.number(), z.literal('')]).optional().nullable(),
  quantity: z.coerce
    .number({ invalid_type_error: 'Enter a quantity of at least 1.' })
    .int('Enter a quantity of at least 1.')
    .min(1, 'Enter a quantity of at least 1.'),
  description: z.string().trim().max(500, 'Keep it under 500 characters.').optional().or(z.literal('')),
});

export const templateSchema = z.object({
  name: nameSchema,
  planId: idSchema.refine((v) => Boolean(v), 'Choose a plan.'),
  validityDays: z.coerce
    .number({ invalid_type_error: 'Validity must be between 1 and 365 days.' })
    .int('Validity must be between 1 and 365 days.')
    .min(1, 'Validity must be between 1 and 365 days.')
    .max(365, 'Validity must be between 1 and 365 days.'),
  paymentTermId: z.union([z.string(), z.number(), z.literal('')]).optional(),
  notes: z.string().trim().max(2000, 'Keep it under 2000 characters.').optional().or(z.literal('')),
  lines: z.array(templateLineSchema).min(1, 'Add at least one line.'),
});

// OP-1 Customers
export const customerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(20, 'Keep it under 20 characters.')
    .regex(/^[0-9 +()-]*$/, 'Use digits, spaces and + ( ) - only.')
    .optional()
    .or(z.literal('')),
  company: z.string().trim().max(120, 'Keep it under 120 characters.').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Keep it under 500 characters.').optional().or(z.literal('')),
});
