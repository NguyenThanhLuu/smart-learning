import { z } from 'zod';

const usernameSchema = z
  .string()
  .trim()
  .min(1, 'Username is required.')
  .max(100, 'Username must not exceed 100 characters.');

const passcodeSchema = z
  .string()
  .trim()
  .min(6, 'Passcode must contain at least 6 characters.')
  .max(128, 'Passcode must not exceed 128 characters.');

export const loginSchema = z.object({
  code: passcodeSchema,
});

export const userAccountSchema = z
  .object({
    name: usernameSchema,
    code: passcodeSchema,
    confirmCode: z.string().trim().min(1, 'Please confirm the passcode.'),
  })
  .refine(({ code, confirmCode }) => code === confirmCode, {
    message: 'Passcode confirmation does not match.',
    path: ['confirmCode'],
  });

export const createArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Article title is required.')
    .max(500, 'Article title must not exceed 500 characters.'),
  content: z
    .string()
    .refine((value) => value.trim().length > 0, 'Article content is required.'),
});

const vocabularyFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vocabulary name is required.')
    .max(200, 'Vocabulary name must not exceed 200 characters.'),
  pronounce: z
    .string()
    .trim()
    .min(1, 'Vocabulary pronunciation is required.')
    .max(500, 'Vocabulary pronunciation must not exceed 500 characters.'),
  meaning: z
    .string()
    .trim()
    .min(1, 'Vocabulary meaning is required.')
    .max(2000, 'Vocabulary meaning must not exceed 2000 characters.'),
});

export const createVocabularySchema = vocabularyFieldsSchema.extend({
  timesReviewed: z.number().int().nonnegative().optional().default(0),
  reviewDate: z.string().trim().min(1, 'Vocabulary review date is required.'),
});

const reviewVocabularySchema = z.object({
  reviewDate: z.string().trim().min(1, 'Vocabulary review date is required.'),
  timesReviewed: z.number().int().nonnegative(),
});

export const updateVocabularySchema = z.union([
  vocabularyFieldsSchema,
  reviewVocabularySchema,
]);
