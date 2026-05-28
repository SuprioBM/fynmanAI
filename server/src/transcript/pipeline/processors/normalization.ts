/**
 * Safe text normalization processor.
 */
import type { TranscriptProcessor } from '../types.ts';
import {
  normalizePunctuationSpacing,
  normalizeRepeatedPunctuation,
  normalizeUnicode,
  normalizeWhitespace,
} from '../../utils/text.ts';

export const normalizationProcessor = (): TranscriptProcessor => ({
  id: 'normalization',
  apply: (state, context) => {
    const options = context.normalization;
    if (options?.enabled === false) {
      return state;
    }

    const unicodeForm = options?.unicodeForm ?? 'NFKC';
    const normalizeSpaces = options?.normalizeWhitespace ?? true;
    const normalizePunctuation = options?.normalizePunctuationSpacing ?? true;
    const maxRepeat = options?.maxRepeatedPunctuation ?? 3;

    const segments = state.segments.map(segment => {
      let text = segment.text;
      text = normalizeUnicode(text, unicodeForm);

      if (normalizeSpaces) {
        text = normalizeWhitespace(text);
      }

      if (normalizePunctuation) {
        text = normalizePunctuationSpacing(text);
      }

      text = normalizeRepeatedPunctuation(text, maxRepeat);

      return {
        ...segment,
        text,
      };
    });

    return {
      ...state,
      segments,
    };
  },
});
