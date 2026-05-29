import { Response } from 'express';
import { AuthRequest } from '#src/types/authRequest.js';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';
import {
  createResource,
  deleteResource,
  getResourceById,
  listResourcesForUser,
  updateResource,
} from '#src/services/resource.service.ts';
import { ingestResourceText } from '#src/services/resource-ingest.service.ts';

type ResourceStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

const isResourceStatus = (value: unknown): value is ResourceStatus =>
  value === 'PENDING' ||
  value === 'PROCESSING' ||
  value === 'READY' ||
  value === 'FAILED';

export const listResourcesHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const status = isResourceStatus(req.query.status)
      ? req.query.status
      : undefined;
    const subject =
      typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const topic =
      typeof req.query.topic === 'string' ? req.query.topic : undefined;

    const resources = await listResourcesForUser(req.userId, {
      status,
      subject,
      topic,
    });

    return sendApiSuccess(res, { data: { resources } });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to list resources',
    });
  }
};

export const createResourceHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const {
      title,
      sourceType,
      text,
      mimeType,
      sourceUrl,
      storageKey,
      subject,
      topic,
      metadata,
    } = req.body as {
      title: string;
      sourceType: 'TEXT' | 'UPLOAD' | 'URL';
      text?: string;
      mimeType?: string;
      sourceUrl?: string;
      storageKey?: string;
      subject?: string;
      topic?: string;
      metadata?: Record<string, unknown> | null;
    };

    const resource = await createResource({
      userId: req.userId,
      title,
      sourceType,
      mimeType,
      sourceUrl,
      storageKey,
      subject,
      topic,
      metadata: metadata || undefined,
    });

    if (sourceType === 'TEXT') {
      const ingest = await ingestResourceText({
        resourceId: resource.id,
        text: text || '',
        subject,
        topic,
      });

      return sendApiSuccess(res, {
        status: 201,
        message: 'Resource ingested',
        data: { resource, ingest },
      });
    }

    if (sourceType === 'URL' && sourceUrl) {
      const { urlIngestQueue } =
        await import('#src/queues/url-ingest.queue.ts');
      const job = await urlIngestQueue.add(
        {
          resourceId: resource.id,
          sourceUrl,
        },
        `url-ingest:${resource.id}`
      );

      return sendApiSuccess(res, {
        status: 202,
        message: 'Resource created. URL ingestion queued.',
        data: { resource, jobId: job.id },
      });
    }

    return sendApiSuccess(res, {
      status: 202,
      message: 'Resource created. Ingestion pending.',
      data: { resource },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to create resource',
      errors: error instanceof Error ? error.message : error,
    });
  }
};

export const updateResourceHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { resourceId } = req.params as { resourceId: string };
    const resource = await getResourceById(resourceId);

    if (!resource || resource.userId !== req.userId) {
      return sendApiError(res, {
        status: 404,
        message: 'Resource not found',
      });
    }

    const updated = await updateResource({
      resourceId,
      title: req.body.title,
      subject: req.body.subject,
      topic: req.body.topic,
      metadata: req.body.metadata,
    });

    return sendApiSuccess(res, {
      message: 'Resource updated',
      data: { resource: updated },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to update resource',
    });
  }
};

export const getResourceHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { resourceId } = req.params as { resourceId: string };
    const resource = await getResourceById(resourceId);

    if (!resource || resource.userId !== req.userId) {
      return sendApiError(res, {
        status: 404,
        message: 'Resource not found',
      });
    }

    return sendApiSuccess(res, { data: { resource } });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch resource',
    });
  }
};

export const deleteResourceHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { resourceId } = req.params as { resourceId: string };
    const resource = await getResourceById(resourceId);

    if (!resource || resource.userId !== req.userId) {
      return sendApiError(res, {
        status: 404,
        message: 'Resource not found',
      });
    }

    await deleteResource(resourceId);

    return sendApiSuccess(res, {
      message: 'Resource deleted',
      data: { resourceId },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to delete resource',
      errors: error instanceof Error ? error.message : error,
    });
  }
};

export const retryResourceIngestionHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { resourceId } = req.params as { resourceId: string };
    const resource = await getResourceById(resourceId);

    if (!resource || resource.userId !== req.userId) {
      return sendApiError(res, {
        status: 404,
        message: 'Resource not found',
      });
    }

    if (resource.status === 'PROCESSING') {
      return sendApiError(res, {
        status: 409,
        message: 'Resource ingestion is already in progress',
      });
    }

    if (resource.sourceType === 'URL' && resource.sourceUrl) {
      const { urlIngestQueue } =
        await import('#src/queues/url-ingest.queue.ts');
      const job = await urlIngestQueue.add(
        {
          resourceId: resource.id,
          sourceUrl: resource.sourceUrl,
        },
        `url-ingest:${resource.id}`
      );

      return sendApiSuccess(res, {
        status: 202,
        message: 'Resource ingestion queued',
        data: { resource, jobId: job.id },
      });
    }

    const text =
      typeof req.body?.text === 'string' && req.body.text.trim()
        ? req.body.text
        : resource.parsedText;

    if (!text?.trim()) {
      return sendApiError(res, {
        status: 400,
        message:
          'No parsed text is available to retry. Re-upload or parse the document first.',
      });
    }

    const ingest = await ingestResourceText({
      resourceId: resource.id,
      text,
      subject: resource.subject || undefined,
      topic: resource.topic || undefined,
    });

    return sendApiSuccess(res, {
      message: 'Resource ingestion retried',
      data: { resource, ingest },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to retry resource ingestion',
      errors: error instanceof Error ? error.message : error,
    });
  }
};

export const getResourceIngestionStatusHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { resourceId } = req.params as { resourceId: string };
    const resource = await getResourceById(resourceId);

    if (!resource || resource.userId !== req.userId) {
      return sendApiError(res, {
        status: 404,
        message: 'Resource not found',
      });
    }

    let jobState: string | null = null;
    if (resource.sourceType === 'URL') {
      const { urlIngestQueue } =
        await import('#src/queues/url-ingest.queue.ts');
      jobState = await urlIngestQueue.getState(`url-ingest:${resource.id}`);
    }

    return sendApiSuccess(res, {
      data: {
        resourceId: resource.id,
        status: resource.status,
        sourceType: resource.sourceType,
        chunkCount: resource.chunks.length,
        jobState,
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch resource ingestion status',
    });
  }
};
