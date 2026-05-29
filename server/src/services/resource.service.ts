import prisma from '#src/config/database.ts';
import { Prisma } from '#src/generated/client.ts';
import {
  deletePoints,
  getQdrantCollection,
} from '#src/services/qdrant.service.ts';

export type CreateResourceInput = {
  userId: string;
  title: string;
  sourceType: 'TEXT' | 'UPLOAD' | 'URL';
  mimeType?: string;
  sourceUrl?: string;
  storageKey?: string;
  subject?: string;
  topic?: string;
  metadata?: Record<string, unknown> | null;
};

type ResourceStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export const listResourcesForUser = async (
  userId: string,
  filters: {
    status?: ResourceStatus;
    subject?: string;
    topic?: string;
  } = {}
) => {
  return prisma.resource.findMany({
    where: {
      userId,
      status: filters.status,
      subject: filters.subject,
      topic: filters.topic,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          chunks: true,
          sessions: true,
        },
      },
    },
  });
};

export const getResourceStatusCountsForUser = async (userId: string) => {
  const rows = await prisma.resource.groupBy({
    by: ['status'],
    where: { userId },
    _count: { _all: true },
  });

  return rows.reduce<Record<ResourceStatus, number>>(
    (counts, row) => {
      counts[row.status as ResourceStatus] = row._count._all;
      return counts;
    },
    {
      PENDING: 0,
      PROCESSING: 0,
      READY: 0,
      FAILED: 0,
    }
  );
};

export const createResource = async (data: CreateResourceInput) => {
  return prisma.resource.create({
    data: {
      userId: data.userId,
      title: data.title,
      sourceType: data.sourceType,
      mimeType: data.mimeType,
      sourceUrl: data.sourceUrl,
      storageKey: data.storageKey,
      subject: data.subject,
      topic: data.topic,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  });
};

export const updateResourceStatus = async (
  resourceId: string,
  status: ResourceStatus
) =>
  prisma.resource.update({
    where: { id: resourceId },
    data: { status },
  });

export const updateResourceFields = async (params: {
  resourceId: string;
  parsedText?: string | null;
  filePath?: string | null;
  storageKey?: string | null;
  metadata?: Record<string, unknown> | null;
}) =>
  prisma.resource.update({
    where: { id: params.resourceId },
    data: {
      parsedText: params.parsedText ?? undefined,
      filePath: params.filePath ?? undefined,
      storageKey: params.storageKey ?? undefined,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });

export const getResourceById = async (resourceId: string) =>
  prisma.resource.findUnique({
    where: { id: resourceId },
    include: { chunks: true },
  });

export const updateResource = async (params: {
  resourceId: string;
  title?: string;
  subject?: string | null;
  topic?: string | null;
  metadata?: Record<string, unknown> | null;
}) =>
  prisma.resource.update({
    where: { id: params.resourceId },
    data: {
      title: params.title,
      subject: params.subject,
      topic: params.topic,
      metadata:
        params.metadata === null
          ? Prisma.JsonNull
          : (params.metadata as Prisma.InputJsonValue | undefined),
    },
  });

export const deleteResource = async (resourceId: string) => {
  const resource = await getResourceById(resourceId);
  if (!resource) {
    return null;
  }

  const pointIds = resource.chunks
    .map(chunk => chunk.vectorId)
    .filter((vectorId): vectorId is string => Boolean(vectorId));

  await deletePoints(getQdrantCollection(), pointIds);

  return prisma.resource.delete({
    where: { id: resourceId },
  });
};

export const clearResourceIngestion = async (resourceId: string) => {
  const resource = await getResourceById(resourceId);
  if (!resource) {
    return;
  }

  const pointIds = resource.chunks
    .map(chunk => chunk.vectorId)
    .filter((vectorId): vectorId is string => Boolean(vectorId));

  await deletePoints(getQdrantCollection(), pointIds);

  await prisma.embedding.deleteMany({
    where: { resourceId },
  });
  await prisma.resourceChunk.deleteMany({
    where: { resourceId },
  });
};

export const attachResourceToSession = async (
  sessionId: string,
  resourceIds: string[]
) => {
  const uniqueResourceIds = Array.from(new Set(resourceIds));
  if (!uniqueResourceIds.length) {
    return;
  }

  await prisma.sessionResource.createMany({
    data: uniqueResourceIds.map(resourceId => ({
      sessionId,
      resourceId,
    })),
    skipDuplicates: true,
  });
};

export const createResourceChunk = async (params: {
  id: string;
  resourceId: string;
  chunkIndex: number;
  text: string;
  embeddingModel?: string;
  vectorId?: string;
  metadata?: Record<string, unknown> | null;
}) =>
  prisma.resourceChunk.create({
    data: {
      id: params.id,
      resourceId: params.resourceId,
      chunkIndex: params.chunkIndex,
      text: params.text,
      embeddingModel: params.embeddingModel,
      vectorId: params.vectorId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });

export const createEmbeddingRecord = async (params: {
  resourceId?: string;
  sessionId?: string;
  resourceChunkId?: string;
  vector: number[];
  model?: string;
}) =>
  prisma.embedding.create({
    data: {
      resourceId: params.resourceId,
      sessionId: params.sessionId,
      resourceChunkId: params.resourceChunkId,
      vector: params.vector,
      model: params.model,
    },
  });
