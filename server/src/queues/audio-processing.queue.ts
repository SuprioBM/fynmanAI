import { createCustomQueue } from '#src/queues/base.queue.ts';
import type { AudioChunkJob } from '#src/services/audio-processing.service.ts';

export const audioProcessingQueue = createCustomQueue<
  AudioChunkJob,
  'audio-processing'
>('audio-processing', 'audio-processing', {
  attempts: Number(process.env.AUDIO_PROCESSING_ATTEMPTS || 2),
  backoff: Number(process.env.AUDIO_PROCESSING_BACKOFF_MS || 1_000),
  keep: 500,
});
