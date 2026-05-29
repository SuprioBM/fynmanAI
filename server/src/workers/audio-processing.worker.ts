import { Worker } from 'bullmq';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import logger from '#src/config/logger.ts';
import {
  processAudioChunk,
  type AudioChunkJob,
} from '#src/services/audio-processing.service.ts';

const queueName = 'audio-processing';
const queuePrefix = process.env.BULLMQ_PREFIX || 'tryora';

export const startAudioProcessingWorker = () => {
  const worker = new Worker<AudioChunkJob>(
    queueName,
    async job => processAudioChunk(job.data),
    {
      connection: bullmqConnection,
      prefix: queuePrefix,
      concurrency: Number(process.env.AUDIO_PROCESSING_CONCURRENCY || 3),
    }
  );

  worker.on('completed', job => {
    logger.info('[Realtime] Audio job completed', {
      jobId: job.id,
      sessionId: job.data.sessionId,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('[Realtime] Audio job failed', {
      jobId: job?.id,
      sessionId: job?.data.sessionId,
      error: error.message,
    });
  });

  return {
    worker,
    close: () => worker.close(),
  };
};
