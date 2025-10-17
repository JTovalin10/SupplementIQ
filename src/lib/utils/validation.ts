import { z } from 'zod';

import { ContributionType, IngredientType, ProductCategory } from '../types';

/**
 * Validation schemas for SupplementIQ
 */

// User validation
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

// Product validation
export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters'),
  brand: z
    .string()
    .min(1, 'Brand is required')
    .max(100, 'Brand name must be less than 100 characters'),
  category: z.enum([
    'protein_powder',
    'mass_gainer',
    'pre_workout',
    'post_workout',
    'multivitamin',
    'omega_3',
    'creatine',
    'bcaa',
    'other',
  ] as const),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  price: z.number().positive('Price must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  serving_size: z.number().positive('Serving size must be positive'),
  serving_unit: z.string().min(1, 'Serving unit is required'),
  claimed_protein: z.number().min(0, 'Claimed protein cannot be negative'),
  ingredients: z
    .array(z.string())
    .min(1, 'At least one ingredient is required'),
});

// Ingredient validation
export const ingredientSchema = z.object({
  name: z
    .string()
    .min(1, 'Ingredient name is required')
    .max(100, 'Ingredient name must be less than 100 characters'),
  type: z.enum([
    'protein_source',
    'carbohydrate',
    'fat',
    'vitamin',
    'mineral',
    'amino_acid',
    'sweetener',
    'flavoring',
    'preservative',
    'other',
  ] as const),
  protein_content: z
    .number()
    .min(0, 'Protein content cannot be negative')
    .max(100, 'Protein content cannot exceed 100%'),
  bioavailability: z
    .number()
    .min(0, 'Bioavailability cannot be negative')
    .max(1, 'Bioavailability cannot exceed 1'),
  amino_acid_profile: z.object({
    lysine: z.number().min(0),
    methionine: z.number().min(0),
    cysteine: z.number().min(0),
    threonine: z.number().min(0),
    tryptophan: z.number().min(0),
    isoleucine: z.number().min(0),
    leucine: z.number().min(0),
    valine: z.number().min(0),
    phenylalanine: z.number().min(0),
    tyrosine: z.number().min(0),
    histidine: z.number().min(0),
  }),
  allergens: z.array(z.string()).default([]),
  source: z.enum(['plant', 'animal', 'synthetic'] as const),
});

// Contribution validation
export const contributionSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  type: z.enum([
    'blend_ratios',
    'ingredient_list',
    'nutrition_facts',
    'product_image',
    'price_update',
    'transparency_improvement',
  ] as const),
  data: z.any(), // Will be validated based on type
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

// Search filters validation
export const searchFiltersSchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  category: z
    .enum([
      'protein_powder',
      'mass_gainer',
      'pre_workout',
      'post_workout',
      'multivitamin',
      'omega_3',
      'creatine',
      'bcaa',
      'other',
    ] as const)
    .optional(),
  min_transparency_score: z.number().min(0).max(100).optional(),
  max_price: z.number().positive().optional(),
  min_effective_protein: z.number().min(0).optional(),
  allergens: z.array(z.string()).optional(),
  source: z.array(z.enum(['plant', 'animal', 'synthetic'] as const)).optional(),
  sort_by: z
    .enum([
      'transparency',
      'cost_efficiency',
      'effective_protein',
      'price',
    ] as const)
    .optional(),
  sort_order: z.enum(['asc', 'desc'] as const).optional(),
  page: z.number().int().positive().default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

// Blend ratio validation
export const blendRatioSchema = z.object({
  ingredient_id: z.string().uuid('Invalid ingredient ID'),
  percentage: z
    .number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100%'),
  confidence: z
    .number()
    .min(0, 'Confidence cannot be negative')
    .max(1, 'Confidence cannot exceed 1')
    .default(0.5),
  source: z
    .enum(['disclosed', 'estimated', 'community_verified'] as const)
    .default('estimated'),
});

// Verification vote validation
export const verificationVoteSchema = z.object({
  contribution_id: z.string().uuid('Invalid contribution ID'),
  vote: z.enum(['approve', 'reject', 'needs_changes'] as const),
  comment: z
    .string()
    .max(500, 'Comment must be less than 500 characters')
    .optional(),
});

/**
 * Custom validation functions
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateUuid(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validatePercentage(value: number): boolean {
  return value >= 0 && value <= 100;
}

export function validateBioavailability(value: number): boolean {
  return value >= 0 && value <= 1;
}

export function validatePositiveNumber(value: number): boolean {
  return value > 0;
}

export function validateNonNegativeNumber(value: number): boolean {
  return value >= 0;
}

/**
 * Sanitization functions
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * File validation
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be a JPEG, PNG, or WebP image' };
  }

  return { valid: true };
}

/**
 * Form validation helpers
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: ['Validation failed'] } };
  }
}
