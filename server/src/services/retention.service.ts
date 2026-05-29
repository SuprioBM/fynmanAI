import path from 'node:path';
import prisma from '#src/config/database.ts';
import logger from '#config/logger.ts';
import { env } from '#config/env.ts';
import {
  deleteFileIfExists,
  isPathInside,
  resolveUploadDir,
} from '#src/utils/file-system.ts';
import { deleteObjectFromS3 } from '#src/services/storage.service.ts';
import {
  deletePoints,
  getQdrantCollection,
} from '#src/services/qdrant.service.ts';

type RetentionPolicy = {
  transcriptDays?: number;
  resourceDays?: number;
  analyticsDays?: number;
};

type RetentionResult = {
  transcriptsDeleted: number;
  analyticsDeleted: number;
  resourcesDeleted: number;
};

let retentionTimer: NodeJS.Timeout | null = null;

const positiveDays = (value?: number): number | undefined =>
  value !== undefined && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;

const cutoffDate = (days: number): Date =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const getRetentionPolicy = (): RetentionPolicy => ({
  transcriptDays: positiveDays(env.TRANSCRIPT_RETENTION_DAYS),
  resourceDays: positiveDays(env.RESOURCE_RETENTION_DAYS),
  analyticsDays: positiveDays(env.ANALYTICS_RETENTION_DAYS),
});

const deleteResourceArtifacts = async (resource: {
  id: string;
  storageKey: string | null;
  filePath: string | null;
  chunks: Array<{ vectorId: string | null }>;
}) => {
  const pointIds = resource.chunks
    .map(chunk => chunk.vectorId)
    .filter((vectorId): vectorId is string => Boolean(vectorId));

  try {
    await deletePoints(getQdrantCollection(), pointIds);
  } catch (error) {
    logger.warn('[Retention] Failed to delete resource vectors', {
      resourceId: resource.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (resource.storageKey && (env.STORAGE_PROVIDER || 's3') === 's3') {
    try {
      await deleteObjectFromS3(resource.storageKey);
    } catch (error) {
      logger.warn('[Retention] Failed to delete S3 object', {
        resourceId: resource.id,
        storageKey: resource.storageKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (resource.filePath) {
    const uploadDir = resolveUploadDir(env.UPLOAD_DIR);
    const resolvedFilePath = path.resolve(resource.filePath);
    if (isPathInside(uploadDir, resolvedFilePath)) {
      try {
        await deleteFileIfExists(resolvedFilePath);
      } catch (error) {
        logger.warn('[Retention] Failed to delete local resource file', {
          resourceId: resource.id,
          filePath: resource.filePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
};

export const applyRetentionPolicies = async (
  policy = getRetentionPolicy()
): Promise<RetentionResult> => {
  const result: RetentionResult = {
    transcriptsDeleted: 0,
    analyticsDeleted: 0,
    resourcesDeleted: 0,
  };

  if (policy.transcriptDays) {
    const deleted = await prisma.transcriptChunk.deleteMany({
      where: {
        createdAt: { lt: cutoffDate(policy.transcriptDays) },
      },
    });
    result.transcriptsDeleted = deleted.count;
  }

  if (policy.analyticsDays) {
    const deleted = await prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: { lt: cutoffDate(policy.analyticsDays) },
      },
    });
    result.analyticsDeleted = deleted.count;
  }

  if (policy.resourceDays) {
    const resources = await prisma.resource.findMany({
      where: {
        sourceType: 'UPLOAD',
        createdAt: { lt: cutoffDate(policy.resourceDays) },
      },
      include: { chunks: true },
    });

    for (const resource of resources) {
      await deleteResourceArtifacts(resource);
      await prisma.resource.delete({ where: { id: resource.id } });
      result.resourcesDeleted += 1;
    }
  }

  return result;
};

export const startRetentionScheduler = () => {
  if (retentionTimer) {
    return;
  }

  const intervalMinutes =
    env.RETENTION_SWEEP_INTERVAL_MINUTES &&
    env.RETENTION_SWEEP_INTERVAL_MINUTES > 0
      ? env.RETENTION_SWEEP_INTERVAL_MINUTES
      : undefined;

  const runSweep = async () => {
    try {
      const result = await applyRetentionPolicies();
      if (
        result.transcriptsDeleted ||
        result.analyticsDeleted ||
        result.resourcesDeleted
      ) {
        logger.info('[Retention] Sweep completed', result);
      }
    } catch (error) {
      logger.warn('[Retention] Sweep failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  if (env.RETENTION_SWEEP_ON_STARTUP) {
    void runSweep();
  }

  if (!intervalMinutes) {
    return;
  }

  retentionTimer = setInterval(
    () => {
      void runSweep();
    },
    intervalMinutes * 60 * 1000
  );
  retentionTimer.unref();
};

export const stopRetentionScheduler = () => {
  if (retentionTimer) {
    clearInterval(retentionTimer);
    retentionTimer = null;
  }
};
