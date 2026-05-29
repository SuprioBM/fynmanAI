import z from 'zod';

export const CreateResourceSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    sourceType: z.enum(['TEXT', 'UPLOAD', 'URL']),
    text: z.string().optional(),
    mimeType: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    storageKey: z.string().optional(),
    subject: z.string().optional(),
    topic: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === 'TEXT' && !value.text?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['text'],
        message: 'Text is required for TEXT resources',
      });
    }

    if (value.sourceType === 'URL' && !value.sourceUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['sourceUrl'],
        message: 'sourceUrl is required for URL resources',
      });
    }

    if (value.sourceType === 'UPLOAD' && !value.storageKey) {
      ctx.addIssue({
        code: 'custom',
        path: ['storageKey'],
        message: 'storageKey is required for UPLOAD resources',
      });
    }
  });

export const UpdateResourceSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
});

export const RetryResourceIngestionSchema = z.object({
  text: z.string().optional(),
});
