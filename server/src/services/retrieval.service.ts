import { generateEmbedding } from '#src/services/ai/ai.service.ts';
import {
  buildResourceFilter,
  getQdrantCollection,
  searchPoints,
} from '#src/services/qdrant.service.ts';

export type RetrievedContextChunk = {
  citationId: string;
  chunkId: string;
  resourceId?: string;
  resourceTitle?: string;
  sourceUrl?: string;
  storageKey?: string;
  chunkIndex?: number;
  subject?: string;
  topic?: string;
  sourceMetadata?: Record<string, unknown>;
  score?: number;
  text: string;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const retrieveContext = async (params: {
  transcript: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
  limit?: number;
}): Promise<RetrievedContextChunk[]> => {
  if (!params.transcript.trim()) {
    return [];
  }

  const embedding = await generateEmbedding(params.transcript);
  const filter = buildResourceFilter({
    resourceIds: params.resourceIds,
    subject: params.subject,
    topic: params.topic,
  });

  const matches = await searchPoints({
    collectionName: getQdrantCollection(),
    vector: embedding.embedding,
    limit: params.limit || 5,
    filter,
  });

  return matches
    .map((match, index): RetrievedContextChunk | null => {
      const text = asString(match.payload?.text);
      if (!text) {
        return null;
      }

      return {
        citationId: `C${index + 1}`,
        chunkId: String(match.id),
        resourceId: asString(match.payload?.resourceId),
        resourceTitle: asString(match.payload?.resourceTitle),
        sourceUrl: asString(match.payload?.sourceUrl),
        storageKey: asString(match.payload?.storageKey),
        chunkIndex: asNumber(match.payload?.chunkIndex),
        subject: asString(match.payload?.subject),
        topic: asString(match.payload?.topic),
        sourceMetadata: asRecord(match.payload?.sourceMetadata),
        score: match.score,
        text,
      };
    })
    .filter((chunk): chunk is RetrievedContextChunk => Boolean(chunk));
};
