/**
 * Pipeline-specific option types and processor interfaces.
 */
import type {
  TranscriptInput,
  TranscriptPipelineResult,
  TranscriptState,
} from '../types.ts';

export type ProfanityMode = 'preserve' | 'mask' | 'remove';
export type FillerHandlingMode = 'annotate' | 'remove';
export type SemanticRepairMode = 'annotate' | 'light';
export type NumberNormalizationMode = 'conservative' | 'aggressive';

export type NormalizationOptions = {
  enabled?: boolean;
  unicodeForm?: 'NFKC' | 'NFC' | 'NFD' | 'NFKD' | 'none';
  normalizeWhitespace?: boolean;
  normalizePunctuationSpacing?: boolean;
  maxRepeatedPunctuation?: number;
};

export type FillerDetectionOptions = {
  enabled?: boolean;
  mode?: FillerHandlingMode;
  singleWordFillers?: string[];
  phraseFillers?: string[];
};

export type DisfluencyOptions = {
  enabled?: boolean;
  detectStutters?: boolean;
  detectSelfCorrections?: boolean;
  detectFalseStarts?: boolean;
};

export type ConfidenceOptions = {
  enabled?: boolean;
  threshold?: number;
};

export type NumberNormalizationOptions = {
  enabled?: boolean;
  mode?: NumberNormalizationMode;
  allowYearNormalization?: boolean;
  allowOrdinalNormalization?: boolean;
  allowCurrencyNormalization?: boolean;
  allowPercentNormalization?: boolean;
  allowDigitSequence?: boolean;
  minDigitsForSequence?: number;
  convertSingleNumbers?: boolean;
};

export type ProfanityOptions = {
  enabled?: boolean;
  mode?: ProfanityMode;
  list?: string[];
  maskToken?: string;
};

export type SpeakerOptions = {
  enabled?: boolean;
  defaultSpeaker?: string;
  speakerMap?: Record<string, string>;
};

export type SentenceSegmentationOptions = {
  enabled?: boolean;
  abbreviations?: Set<string> | string[];
};

export type SemanticRepairOptions = {
  enabled?: boolean;
  mode?: SemanticRepairMode;
  applySelfCorrections?: boolean;
};

export type DomainCorrectionOptions = {
  enabled?: boolean;
  dictionary?: Record<string, string>;
  fuzzyThreshold?: number;
  allowOnLowConfidence?: boolean;
  maxCorrections?: number;
};

export type ChunkingOptions = {
  enabled?: boolean;
  maxTokens?: number;
  minTokens?: number;
  maxSegments?: number;
  includeSpeakerLabels?: boolean;
  splitOnSpeakerChange?: boolean;
};

export type TranscriptProcessorContext = {
  language?: string;
  normalization?: NormalizationOptions;
  fillers?: FillerDetectionOptions;
  disfluency?: DisfluencyOptions;
  confidence?: ConfidenceOptions;
  numbers?: NumberNormalizationOptions;
  profanity?: ProfanityOptions;
  speaker?: SpeakerOptions;
  segmentation?: SentenceSegmentationOptions;
  semanticRepair?: SemanticRepairOptions;
  domain?: DomainCorrectionOptions;
  chunking?: ChunkingOptions;
};

export type TranscriptProcessor = {
  id: string;
  apply: (
    state: TranscriptState,
    context: TranscriptProcessorContext
  ) => TranscriptState;
};

export type TranscriptPipeline = {
  process: (input: TranscriptInput) => TranscriptPipelineResult;
  processors: TranscriptProcessor[];
  context: TranscriptProcessorContext;
};
