import z from 'zod';

const ResourceIdSchema = z.string().trim().min(1, 'Resource id is required');

export const StartSessionSchema = z
  .object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    goal: z.string().optional(),
    resourceId: ResourceIdSchema.optional(),
    resourceIds: z.array(ResourceIdSchema).optional(),
  })
  .transform(({ resourceId, resourceIds, ...data }) => ({
    ...data,
    resourceIds: Array.from(
      new Set([...(resourceIds || []), ...(resourceId ? [resourceId] : [])])
    ),
  }));

export const AppendTranscriptSchema = z.object({
  text: z.string().min(1, 'Transcript text is required'),
  startTimeMs: z.number().int().optional(),
  endTimeMs: z.number().int().optional(),
});

export const GenerateEvaluationSchema = z.object({
  type: z.enum(['ROLLING', 'FINAL']).default('FINAL'),
});
