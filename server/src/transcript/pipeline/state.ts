/**
 * Shared state helpers for transcript pipeline execution.
 */
import { createId } from '../utils/id.ts';
import type {
  ProcessedTranscript,
  TranscriptInput,
  TranscriptPipelineResult,
  TranscriptSegment,
  TranscriptState,
  WordToken,
} from '../types.ts';

const ensureSegmentId = (id?: string): string => id || createId('segment');

const normalizeSpeaker = (speaker?: string): string | undefined => {
  if (!speaker) {
    return undefined;
  }
  const trimmed = speaker.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;
};

const normalizeTokens = (tokens?: WordToken[]): WordToken[] | undefined => {
  if (!tokens?.length) {
    return undefined;
  }
  return tokens.map(token => ({ ...token }));
};

const formatSegmentText = (segment: TranscriptSegment): string => {
  const text = segment.text.trim();
  if (!text) {
    return '';
  }

  if (!segment.speaker) {
    return text;
  }

  const label = segment.speaker.trim();
  const lowerLabel = label.toLowerCase();
  if (text.toLowerCase().startsWith(`${lowerLabel}:`)) {
    return text;
  }

  return `${label}: ${text}`;
};

export const buildCleanedText = (segments: TranscriptSegment[]): string =>
  segments
    .map(segment => formatSegmentText(segment))
    .filter(Boolean)
    .join('\n');

const buildSegmentsFromInput = (
  input: TranscriptInput
): TranscriptSegment[] => {
  if (input.segments?.length) {
    return input.segments.map(segment => ({
      id: ensureSegmentId(segment.id),
      speaker: normalizeSpeaker(segment.speaker ?? input.speaker),
      text: segment.text,
      rawText: segment.rawText ?? segment.text,
      startMs: segment.startMs,
      endMs: segment.endMs,
      confidence: segment.confidence,
      tokens: normalizeTokens(segment.tokens),
      metadata: segment.metadata ? { ...segment.metadata } : undefined,
    }));
  }

  return [
    {
      id: ensureSegmentId(),
      speaker: normalizeSpeaker(input.speaker),
      text: input.raw,
      rawText: input.raw,
      tokens: normalizeTokens(input.tokens),
    },
  ];
};

export const createInitialState = (input: TranscriptInput): TranscriptState => {
  const segments = buildSegmentsFromInput(input);
  return {
    raw: input.raw,
    segments,
    cleanedText: buildCleanedText(segments),
    language: input.language,
    chunks: [],
    metadata: {
      processingSteps: [],
      warnings: [],
    },
  };
};

export const updateSegments = (
  state: TranscriptState,
  segments: TranscriptSegment[]
): TranscriptState => ({
  ...state,
  segments,
  cleanedText: buildCleanedText(segments),
});

export const addWarning = (
  state: TranscriptState,
  warning: string
): TranscriptState => {
  if (state.metadata.warnings.includes(warning)) {
    return state;
  }
  return {
    ...state,
    metadata: {
      ...state.metadata,
      warnings: [...state.metadata.warnings, warning],
    },
  };
};

export const addProcessingStep = (
  state: TranscriptState,
  stepId: string
): TranscriptState => ({
  ...state,
  metadata: {
    ...state.metadata,
    processingSteps: [...state.metadata.processingSteps, stepId],
  },
});

export const toPipelineResult = (
  state: TranscriptState
): TranscriptPipelineResult => {
  const result: ProcessedTranscript = {
    raw: state.raw,
    cleanedText: state.cleanedText,
    segments: state.segments,
    language: state.language,
    metadata: {
      processingSteps: state.metadata.processingSteps,
      warnings: state.metadata.warnings,
    },
  };

  return {
    ...result,
    chunks: state.chunks,
  };
};
