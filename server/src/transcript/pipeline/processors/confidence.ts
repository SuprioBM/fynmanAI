/**
 * Confidence-aware annotation processor.
 */
import type { TranscriptProcessor } from '../types.ts';
import type { WordToken } from '../../types.ts';

type ConfidenceSpan = {
  text: string;
  confidence: number;
};

const groupLowConfidence = (
  tokens: WordToken[],
  threshold: number
): ConfidenceSpan[] => {
  const spans: ConfidenceSpan[] = [];
  let current: WordToken[] = [];

  const flush = () => {
    if (!current.length) {
      return;
    }

    const confidence = Math.min(
      ...current
        .map(token => token.confidence)
        .filter((value): value is number => typeof value === 'number')
    );

    spans.push({
      text: current.map(token => token.text).join(' '),
      confidence,
    });
    current = [];
  };

  for (const token of tokens) {
    if (typeof token.confidence !== 'number') {
      flush();
      continue;
    }

    if (token.confidence < threshold) {
      current.push(token);
    } else {
      flush();
    }
  }

  flush();
  return spans;
};

export const confidenceProcessor = (): TranscriptProcessor => ({
  id: 'confidence',
  apply: (state, context) => {
    const options = context.confidence;
    if (options?.enabled === false) {
      return state;
    }

    const threshold = options?.threshold ?? 0.6;

    const segments = state.segments.map(segment => {
      if (!segment.tokens?.length) {
        return segment;
      }

      const spans = groupLowConfidence(segment.tokens, threshold);
      if (!spans.length) {
        return segment;
      }

      return {
        ...segment,
        metadata: {
          ...segment.metadata,
          lowConfidenceSpans: spans,
        },
      };
    });

    return {
      ...state,
      segments,
    };
  },
});
