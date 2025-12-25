import { z } from 'zod';

export const createGistSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be under 100 characters'),
    description: z
        .string()
        .max(500, 'Description must be under 500 characters')
        .optional(),
    content: z
        .string()
        .max(100000, 'Content is too large'),
});

export type CreateGistFormDataType = z.infer<typeof createGistSchema>;

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
