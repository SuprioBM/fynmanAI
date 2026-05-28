/**
 * Example usage and sample transformation for the transcript pipeline.
 */
import {
  processTranscript,
  type TranscriptProcessorContext,
} from './pipeline/index.ts';
import type { TranscriptInput } from './types.ts';

export const sampleInput: TranscriptInput = {
  raw: 'um I think basically this works. The meeting is Thursday -- sorry Friday. We shipped twenty twenty four new features.',
  speaker: 'User',
};

export const sampleOptions: TranscriptProcessorContext = {
  fillers: { mode: 'remove' },
  semanticRepair: { mode: 'light', applySelfCorrections: true },
  domain: {
    dictionary: {
      'lang chain': 'LangChain',
      'open eye': 'OpenAI',
    },
    fuzzyThreshold: 0.88,
  },
  chunking: {
    maxTokens: 120,
  },
};

export const buildSampleTransformation = () => {
  const output = processTranscript(sampleInput, sampleOptions);
  return { input: sampleInput, output };
};
