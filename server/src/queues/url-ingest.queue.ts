import { createCustomQueue } from '#src/queues/base.queue.ts';

export type UrlIngestJob = {
  resourceId: string;
  sourceUrl: string;
};

export const urlIngestQueue = createCustomQueue<UrlIngestJob, 'url-ingest'>(
  'url-ingest',
  'url-ingest',
  {
    attempts: 3,
    backoff: 5_000,
    keep: 200,
  }
);
