import logger from '#config/logger.ts';
import { env } from '#config/env.ts';
import { transcribeAudioBuffer } from '#src/services/stt.service.ts';
import { preprocessTranscript } from '#src/services/transcript-preprocess.service.ts';
import {
  appendTranscriptChunk,
  getSessionById,
} from '#src/services/session.service.ts';
import { maybeGenerateRealtimeFeedback } from '#src/services/evaluation.service.ts';

export type AudioChunkJob = {
  sessionId: string;
  userId: string;
  audioBase64: string;
  fileName?: string;
  mimeType?: string;
  speakerLabel?: string;
  startTimeMs?: number;
  endTimeMs?: number;
  sequence?: number;
};

export type AudioChunkProcessResult = {
  sessionId: string;
  chunk: Awaited<ReturnType<typeof appendTranscriptChunk>> | null;
  evaluation: Awaited<ReturnType<typeof maybeGenerateRealtimeFeedback>> | null;
  skipped?: 'silence' | 'empty-transcript';
};

const SILENCE_TEXT_PATTERNS = [
  '',
  '[silence]',
  '(silence)',
  'silence',
  '[inaudible]',
  '(inaudible)',
];

const transcribeWithRetry = async (params: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
}) => {
  const attempts = Math.max(1, env.AUDIO_PROCESSING_ATTEMPTS || 2);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await transcribeAudioBuffer(params);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        logger.warn('[Realtime] STT attempt failed; retrying audio chunk', {
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  throw lastError;
};

export const processAudioChunk = async (
  job: AudioChunkJob
): Promise<AudioChunkProcessResult> => {
  const session = await getSessionById(job.sessionId);
  if (!session || session.userId !== job.userId) {
    throw new Error('Session not found');
  }

  const buffer = Buffer.from(job.audioBase64, 'base64');
  const transcript = await transcribeWithRetry({
    buffer,
    fileName: job.fileName || `chunk-${Date.now()}.webm`,
    mimeType: job.mimeType,
  });

  const speakerLabel = job.speakerLabel || 'User';
  const processedTranscript = preprocessTranscript(
    {
      raw: transcript.text,
      speaker: speakerLabel,
    },
    {
      speakerLabel,
    }
  );
  const cleanedText = processedTranscript.cleanedText.trim();

  if (SILENCE_TEXT_PATTERNS.includes(cleanedText.toLowerCase())) {
    return {
      sessionId: job.sessionId,
      chunk: null,
      evaluation: null,
      skipped: 'silence',
    };
  }

  if (!cleanedText) {
    return {
      sessionId: job.sessionId,
      chunk: null,
      evaluation: null,
      skipped: 'empty-transcript',
    };
  }

  const chunk = await appendTranscriptChunk({
    sessionId: job.sessionId,
    text: cleanedText,
    startTimeMs: job.startTimeMs,
    endTimeMs: job.endTimeMs,
  });

  const evaluation = await maybeGenerateRealtimeFeedback({
    sessionId: job.sessionId,
    subject: session.subject || undefined,
    topic: session.topic || undefined,
    resourceIds: session.resources.map(item => item.resourceId),
    goal: session.goal || undefined,
  });

  return {
    sessionId: job.sessionId,
    chunk,
    evaluation,
  };
};
