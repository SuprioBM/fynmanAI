import type {
  TranscriptInput,
  TranscriptPipelineResult,
} from '#src/transcript/types.ts';
import {
  processTranscript,
  type ProfanityMode,
  type TranscriptProcessorContext,
} from '#src/transcript/pipeline/index.ts';

export type PreprocessOptions = TranscriptProcessorContext & {
  speakerLabel?: string;
  redactToken?: string;
  enableProfanityFilter?: boolean;
  profanityMode?: ProfanityMode;
  domainDictionary?: Record<string, string>;
};

const buildPipelineContext = (
  options: PreprocessOptions
): TranscriptProcessorContext => {
  const {
    speakerLabel,
    redactToken,
    enableProfanityFilter,
    profanityMode,
    domainDictionary,
    ...contextOverrides
  } = options;

  const context: TranscriptProcessorContext = {
    ...contextOverrides,
  };

  if (speakerLabel) {
    context.speaker = {
      ...context.speaker,
      defaultSpeaker: speakerLabel,
    };
  }

  if (domainDictionary) {
    context.domain = {
      ...context.domain,
      dictionary: domainDictionary,
    };
  }

  if (redactToken || enableProfanityFilter !== undefined || profanityMode) {
    let resolvedMode = context.profanity?.mode;
    if (profanityMode) {
      resolvedMode = profanityMode;
    } else if (enableProfanityFilter !== undefined) {
      resolvedMode = enableProfanityFilter ? 'mask' : 'preserve';
    }

    context.profanity = {
      ...context.profanity,
      ...(resolvedMode ? { mode: resolvedMode } : {}),
      ...(redactToken ? { maskToken: redactToken } : {}),
    };
  }

  return context;
};

export const preprocessTranscript = (
  input: TranscriptInput,
  options: PreprocessOptions = {}
): TranscriptPipelineResult => {
  const context = buildPipelineContext(options);
  return processTranscript(input, context);
};

export const preprocessTranscriptText = (
  text: string,
  options: PreprocessOptions = {}
): string => {
  const input: TranscriptInput = {
    raw: text ?? '',
    language: options.language,
    speaker: options.speakerLabel,
  };

  const result = preprocessTranscript(input, options);
  return result.cleanedText.trim();
};
