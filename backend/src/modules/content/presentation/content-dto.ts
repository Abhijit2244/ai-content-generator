import { z } from 'zod';

export const contentTypes = [
  'blog',
  'social_linkedin',
  'social_instagram',
  'social_x',
  'email',
  'marketing',
  'product_description',
  'study_notes',
  'report',
  'creative_writing',
] as const;

export const tones = [
  'professional',
  'casual',
  'friendly',
  'persuasive',
  'informative',
  'creative',
  'humorous',
  'academic',
] as const;

export const lengths = ['short', 'medium', 'long'] as const;

export const generateContentSchema = z.object({
  title: z.string().min(1, 'Title or topic is required').max(200),
  contentType: z.enum(contentTypes),
  tone: z.enum(tones),
  length: z.enum(lengths),
  targetAudience: z.string().max(200).optional().default(''),
  keywords: z.array(z.string().max(50)).max(15).optional().default([]),
  context: z.string().max(2000).optional().default(''),
  referenceText: z.string().max(10000).optional().default(''),
});

export const updateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
});

export const listContentQuerySchema = z.object({
  search: z.string().optional(),
  contentType: z.enum(contentTypes).optional(),
  sortBy: z.enum(['updatedAt', 'title', 'createdAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const refineContentSchema = z.object({
  action: z.enum([
    'rewrite',
    'improve_grammar',
    'simplify',
    'expand',
    'shorten',
    'change_tone',
    'improve_readability',
  ]),
  instruction: z.string().max(1000).optional().default(''),
  scope: z.enum(['full', 'partial']).default('full'),
  selectedText: z.string().nullable().optional(),
  currentContent: z.string().optional(), // optional client draft before refining
});

export const variationsSchema = z.object({
  count: z.coerce.number().int().min(1).max(3).default(3),
  currentContent: z.string().optional(),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type ListContentQueryInput = z.infer<typeof listContentQuerySchema>;
export type RefineContentInput = z.infer<typeof refineContentSchema>;
export type VariationsInput = z.infer<typeof variationsSchema>;
