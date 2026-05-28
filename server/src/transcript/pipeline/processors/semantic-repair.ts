/**
 * Semantic repair processor for light fixes.
 */
import type { TranscriptProcessor } from '../types.ts';
import { normalizeWhitespace } from '../../utils/text.ts';

const STUTTER_HYPHEN_PATTERN = /(\b\w+)(?:\s*[-\u2013\u2014]\s*\1)+/gi;
const STUTTER_REPEAT_PATTERN = /\b(\w+)(?:\s+\1\b)+/gi;

const reduceStutters = (text: string): string => {
  let result = text.replace(STUTTER_HYPHEN_PATTERN, '$1');
  while (STUTTER_REPEAT_PATTERN.test(result)) {
    result = result.replace(STUTTER_REPEAT_PATTERN, '$1');
  }
  return normalizeWhitespace(result);
};

const replaceOnce = (text: string, from: string, to: string): string => {
  const index = text.indexOf(from);
  if (index === -1) {
    return text;
  }

  if (text.indexOf(from, index + from.length) !== -1) {
    return text;
  }

  return text.slice(0, index) + to + text.slice(index + from.length);
};

export const semanticRepairProcessor = (): TranscriptProcessor => ({
  id: 'semantic-repair',
  apply: (state, context) => {
    const options = context.semanticRepair;
    if (options?.enabled === false) {
      return state;
    }

    const mode = options?.mode ?? 'annotate';
    const applySelfCorrections = options?.applySelfCorrections ?? false;

    if (mode === 'annotate' && !applySelfCorrections) {
      return state;
    }

    const segments = state.segments.map(segment => {
      let text = segment.text;

      if (mode === 'light') {
        text = reduceStutters(text);
      }

      const corrections = segment.metadata?.corrections ?? [];
      if (applySelfCorrections) {
        for (const correction of corrections) {
          if (correction.reason !== 'self-correction') {
            continue;
          }
          text = replaceOnce(text, correction.from, correction.to);
        }
      }

      if (text === segment.text) {
        return segment;
      }

      return {
        ...segment,
        text,
        metadata: {
          ...segment.metadata,
          corrections: [
            ...(segment.metadata?.corrections ?? []),
            {
              from: segment.text,
              to: text,
              reason: 'semantic-repair',
            },
          ],
        },
      };
    });

    return {
      ...state,
      segments,
    };
  },
});
