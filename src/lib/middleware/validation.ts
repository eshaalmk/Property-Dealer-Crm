import { z } from 'zod';
import { NextResponse } from 'next/server';

export const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Invalid phone number').max(20),
  propertyInterest: z.enum(['Residential', 'Commercial', 'Plot', 'Apartment', 'Villa', 'Office']),
  location: z.string().min(2, 'Location required').max(200),
  budget: z.number().min(0, 'Budget must be positive').max(10_000_000_000),
  status: z.enum(['New', 'Contacted', 'In Progress', 'Negotiation', 'Closed', 'Lost']).optional(),
  notes: z.string().max(2000).optional(),
  source: z.enum(['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Other']).optional(),
  assignedTo: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'agent']).optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return {
      valid: false,
      error: NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 }),
    };
  }
  return { valid: true, data: result.data };
}
