import crypto from 'node:crypto';
import { generateEmbedding } from '#src/services/ai/ai.service.ts';
import {
  createEmbeddingRecord,
  createResourceChunk,
  clearResourceIngestion,
  getResourceById,
  updateResourceStatus,
  updateResourceFields,
} from '#src/services/resource.service.ts';
import { trackAnalyticsEvent } from '#src/services/analytics.service.ts';
import {
  ensureCollection,
  getQdrantCollection,
  upsertPoints,
} from '#src/services/qdrant.service.ts';
import {
  normalizePunctuationSpacing,
  normalizeRepeatedPunctuation,
  normalizeUnicode,
  normalizeWhitespace,
  tokenizeWords,
} from '#src/transcript/utils/text.ts';
import { env } from '#config/env.ts';

const cleanResourceText = (text: string): string => {
  let result = normalizeUnicode(text, 'NFKC');
  result = normalizeWhitespace(result);
  result = normalizePunctuationSpacing(result);
  result = normalizeRepeatedPunctuation(result, 3);
  return result.trim();
};

const chunkText = (
  text: string,
  size = env.RESOURCE_CHUNK_TOKENS || 600,
  overlap = env.RESOURCE_CHUNK_OVERLAP || 80
): string[] => {
  const spans = tokenizeWords(text);
  if (!spans.length) {
    return [];
  }

  const safeOverlap = Math.min(Math.max(0, overlap), Math.max(0, size - 1));
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < spans.length) {
    const end = Math.min(cursor + size, spans.length);
    const startChar = spans[cursor].start;
    const endChar = spans[end - 1].end;
    const chunk = text.slice(startChar, endChar).trim();
    if (chunk.length) {
      chunks.push(chunk);
    }

    if (end === spans.length) {
      break;
    }

    const nextCursor = end - safeOverlap;
    cursor = nextCursor <= cursor ? end : nextCursor;
  }

  return chunks;
};

export const ingestResourceText = async (params: {
  resourceId: string;
  text: string;
  subject?: string;
  topic?: string;
}): Promise<{ chunkCount: number }> => {
  await updateResourceStatus(params.resourceId, 'PROCESSING');

  let resource: Awaited<ReturnType<typeof getResourceById>> | undefined;

  try {
    resource = await getResourceById(params.resourceId);

    await trackAnalyticsEvent({
      event: 'resource.ingestion.started',
      userId: resource?.userId,
      payload: { resourceId: params.resourceId },
    });

    const cleanedText = cleanResourceText(params.text);
    const subject = params.subject || resource?.subject || undefined;
    const topic = params.topic || resource?.topic || undefined;
    const chunks = chunkText(cleanedText);
    if (!chunks.length) {
      throw new Error('No text content to ingest');
    }

    await clearResourceIngestion(params.resourceId);

    await updateResourceFields({
      resourceId: params.resourceId,
      parsedText: cleanedText,
      filePath: resource?.filePath || resource?.storageKey || null,
      storageKey: resource?.storageKey || null,
    });

    const sourceMetadata = {
      sourceType: resource?.sourceType,
      mimeType: resource?.mimeType,
      sourceUrl: resource?.sourceUrl,
      storageKey: resource?.storageKey,
      filePath: resource?.filePath || resource?.storageKey,
      resourceMetadata: resource?.metadata,
    };

    const collectionName = getQdrantCollection();
    const firstEmbedding = await generateEmbedding(chunks[0]);
    await ensureCollection(collectionName, firstEmbedding.embedding.length);

    const points = [
      {
        id: crypto.randomUUID(),
        vector: firstEmbedding.embedding,
        payload: {
          resourceId: params.resourceId,
          subject,
          topic,
          chunkIndex: 0,
          text: chunks[0],
          resourceTitle: resource?.title,
          sourceUrl: resource?.sourceUrl,
          storageKey: resource?.storageKey,
          sourceMetadata,
        },
      },
    ];

    await upsertPoints(collectionName, points);
    await createResourceChunk({
      id: String(points[0].id),
      resourceId: params.resourceId,
      chunkIndex: 0,
      text: chunks[0],
      embeddingModel: firstEmbedding.model,
      vectorId: String(points[0].id),
      metadata: {
        subject,
        topic,
        ...sourceMetadata,
      },
    });

    await createEmbeddingRecord({
      resourceId: params.resourceId,
      resourceChunkId: String(points[0].id),
      vector: firstEmbedding.embedding,
      model: firstEmbedding.model,
    });

    for (let index = 1; index < chunks.length; index += 1) {
      const chunkTextValue = chunks[index];
      const embedding = await generateEmbedding(chunkTextValue);
      const chunkId = crypto.randomUUID();

      await upsertPoints(collectionName, [
        {
          id: chunkId,
          vector: embedding.embedding,
          payload: {
            resourceId: params.resourceId,
            subject,
            topic,
            chunkIndex: index,
            text: chunkTextValue,
            resourceTitle: resource?.title,
            sourceUrl: resource?.sourceUrl,
            storageKey: resource?.storageKey,
            sourceMetadata,
          },
        },
      ]);

      await createResourceChunk({
        id: chunkId,
        resourceId: params.resourceId,
        chunkIndex: index,
        text: chunkTextValue,
        embeddingModel: embedding.model,
        vectorId: chunkId,
        metadata: {
          subject,
          topic,
          ...sourceMetadata,
        },
      });

      await createEmbeddingRecord({
        resourceId: params.resourceId,
        resourceChunkId: chunkId,
        vector: embedding.embedding,
        model: embedding.model,
      });
    }

    await updateResourceStatus(params.resourceId, 'READY');

    await trackAnalyticsEvent({
      event: 'resource.ingestion.completed',
      userId: resource?.userId,
      payload: { resourceId: params.resourceId, chunkCount: chunks.length },
    });

    return { chunkCount: chunks.length };
  } catch (error) {
    await updateResourceStatus(params.resourceId, 'FAILED');

    await trackAnalyticsEvent({
      event: 'resource.ingestion.failed',
      userId: resource?.userId,
      payload: {
        resourceId: params.resourceId,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
};
