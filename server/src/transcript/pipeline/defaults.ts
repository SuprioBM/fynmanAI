/**
 * Default pipeline configuration and helper entrypoints.
 */
import type { TranscriptInput, TranscriptPipelineResult } from '../types.ts';
import { createTranscriptPipeline } from './pipeline.ts';
import type { TranscriptProcessorContext } from './types.ts';
import { normalizationProcessor } from './processors/normalization.ts';
import { speakerProcessor } from './processors/speaker.ts';
import { fillerDetectionProcessor } from './processors/filler-detection.ts';
import { disfluencyDetectionProcessor } from './processors/disfluency-detection.ts';
import { confidenceProcessor } from './processors/confidence.ts';
import { numberNormalizationProcessor } from './processors/number-normalization.ts';
import { sentenceSegmentationProcessor } from './processors/sentence-segmentation.js';
import { semanticRepairProcessor } from './processors/semantic-repair.ts';
import { domainCorrectionProcessor } from './processors/domain-correction.ts';
import { profanityProcessor } from './processors/profanity.ts';
import { chunkingProcessor } from './processors/chunking.js';

const DEFAULT_CONTEXT: TranscriptProcessorContext = {
  normalization: {
    enabled: true,
    unicodeForm: 'NFKC',
    normalizeWhitespace: true,
    normalizePunctuationSpacing: true,
    maxRepeatedPunctuation: 3,
  },
  speaker: {
    enabled: true,
  },
  fillers: {
    enabled: true,
    mode: 'annotate',
  },
  disfluency: {
    enabled: true,
    detectStutters: true,
    detectSelfCorrections: true,
    detectFalseStarts: true,
  },
  confidence: {
    enabled: true,
    threshold: 0.6,
  },
  numbers: {
    enabled: true,
    mode: 'conservative',
    allowYearNormalization: true,
    allowOrdinalNormalization: true,
    allowCurrencyNormalization: true,
    allowPercentNormalization: true,
    allowDigitSequence: true,
    minDigitsForSequence: 3,
    convertSingleNumbers: false,
  },
  segmentation: {
    enabled: true,
  },
  semanticRepair: {
    enabled: true,
    mode: 'annotate',
    applySelfCorrections: false,
  },
  domain: {
    enabled: true,
    dictionary: {},
    fuzzyThreshold: 0.9,
    allowOnLowConfidence: false,
    maxCorrections: 25,
  },
  profanity: {
    enabled: true,
    mode: 'preserve',
  },
  chunking: {
    enabled: true,
    maxTokens: 220,
    minTokens: 40,
    maxSegments: 12,
    includeSpeakerLabels: true,
    splitOnSpeakerChange: true,
  },
};

const mergeOptions = (
  base: TranscriptProcessorContext,
  overrides?: TranscriptProcessorContext
): TranscriptProcessorContext => ({
  ...base,
  ...overrides,
  normalization: { ...base.normalization, ...overrides?.normalization },
  speaker: { ...base.speaker, ...overrides?.speaker },
  fillers: { ...base.fillers, ...overrides?.fillers },
  disfluency: { ...base.disfluency, ...overrides?.disfluency },
  confidence: { ...base.confidence, ...overrides?.confidence },
  numbers: { ...base.numbers, ...overrides?.numbers },
  segmentation: { ...base.segmentation, ...overrides?.segmentation },
  semanticRepair: { ...base.semanticRepair, ...overrides?.semanticRepair },
  domain: { ...base.domain, ...overrides?.domain },
  profanity: { ...base.profanity, ...overrides?.profanity },
  chunking: { ...base.chunking, ...overrides?.chunking },
});

export const createDefaultTranscriptPipeline = (
  contextOverrides?: TranscriptProcessorContext
) =>
  createTranscriptPipeline(
    [
      normalizationProcessor(),
      speakerProcessor(),
      fillerDetectionProcessor(),
      disfluencyDetectionProcessor(),
      confidenceProcessor(),
      numberNormalizationProcessor(),
      sentenceSegmentationProcessor(),
      semanticRepairProcessor(),
      domainCorrectionProcessor(),
      profanityProcessor(),
      chunkingProcessor(),
    ],
    mergeOptions(DEFAULT_CONTEXT, contextOverrides)
  );

export const processTranscript = (
  input: TranscriptInput,
  contextOverrides?: TranscriptProcessorContext
): TranscriptPipelineResult =>
  createDefaultTranscriptPipeline(contextOverrides).process(input);
