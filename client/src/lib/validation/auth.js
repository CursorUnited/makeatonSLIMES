// Copy to client/src/lib/validation/auth.js
// Mirror of server/src/lib/validation.js + server/src/modules/auth/auth.schema.js.
// Server is authoritative; keep the regex and messages identical.
// Works with zod v3 and v4.
import { z } from 'zod';

/** "More than eight characters" = at least 9; plus lowercase, uppercase and a special character. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;
export const PASSWORD_MESSAGE =
  'Use at least 9 characters with an uppercase letter, a lowercase letter and a special character.';

/** Live checklist for AU-1 / AU-4 (UI_UX_SPEC §5.1). */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 9 characters', test: (v) => v.length >= 9 },
  { id: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { id: 'special', label: 'One special character (for example ! @ # $)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export const passwordSchema = z.string().max(72, 'Use at most 72 characters.').regex(PASSWORD_REGEX, PASSWORD_MESSAGE);

export const emailSchema = z.string().trim().toLowerCase().max(254).email('Enter a valid email address.');

const phoneSchema = z
  .string()
  .trim()
  .max(20, 'Keep it under 20 characters.')
  .regex(/^[0-9 +()-]*$/, 'Use digits, spaces and + ( ) - only.')
  .optional();

// AU-1 Sign up (confirmPassword is client-only; don't send it)
export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter a name.').max(100, 'Keep it under 100 characters.'),
    company: z.string().trim().max(120, 'Keep it under 120 characters.').optional(),
    phone: phoneSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

// AU-2 Log in
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

// AU-3 Forgot password
export const forgotPasswordSchema = z.object({ email: emailSchema });

// AU-4 Reset password (token comes from ?token= in the URL)
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

// AD-7 New staff member (Admin)
export const createStaffSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name.').max(100, 'Keep it under 100 characters.'),
  email: emailSchema,
  password: passwordSchema,
});
