import { Worker } from 'bullmq';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import logger from '#src/config/logger.ts';
import { ingestResourceFromUrl } from '#src/services/url-ingest.service.ts';
import type { UrlIngestJob } from '#src/queues/url-ingest.queue.ts';

const queueName = 'url-ingest';
const queuePrefix = process.env.BULLMQ_PREFIX || 'tryora';

export const startUrlIngestWorker = () => {
  const worker = new Worker<UrlIngestJob>(
    queueName,
    async job => {
      await ingestResourceFromUrl({
        resourceId: job.data.resourceId,
        sourceUrl: job.data.sourceUrl,
      });
    },
    {
      connection: bullmqConnection,
      prefix: queuePrefix,
      concurrency: 2,
    }
  );

  worker.on('completed', job => {
    logger.info('[URL Ingest] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    logger.error('[URL Ingest] Job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  return {
    worker,
    close: () => worker.close(),
  };
};
