/**
 * Profanity detection processor with configurable handling.
 */
import type { TranscriptProcessor } from '../types.ts';
import {
  applyReplacements,
  filterOverlappingReplacements,
  type TextReplacement,
} from '../../utils/replacements.ts';
import { normalizeWhitespace, tokenizeWords } from '../../utils/text.ts';

const DEFAULT_PROFANITY = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'piss',
  'crap',
  'damn',
];

export const profanityProcessor = (): TranscriptProcessor => ({
  id: 'profanity',
  apply: (state, context) => {
    const options = context.profanity;
    if (options?.enabled === false) {
      return state;
    }

    const mode = options?.mode ?? 'preserve';
    const maskToken = options?.maskToken ?? '****';
    const profanityList = new Set(
      (options?.list ?? DEFAULT_PROFANITY).map(word => word.toLowerCase())
    );

    const segments = state.segments.map(segment => {
      const wordSpans = tokenizeWords(segment.text);
      if (!wordSpans.length) {
        return segment;
      }

      const replacements: TextReplacement[] = [];
      let detected = false;

      for (const span of wordSpans) {
        const lower = span.text.toLowerCase();
        if (!profanityList.has(lower)) {
          continue;
        }

        detected = true;
        if (mode === 'mask') {
          replacements.push({
            start: span.start,
            end: span.end,
            text: maskToken,
          });
        } else if (mode === 'remove') {
          replacements.push({ start: span.start, end: span.end, text: '' });
        }
      }

      if (!detected) {
        return segment;
      }

      let text = segment.text;
      if (mode !== 'preserve' && replacements.length) {
        const filtered = filterOverlappingReplacements(replacements);
        text = applyReplacements(text, filtered);
        text = normalizeWhitespace(text);
      }

      return {
        ...segment,
        text,
        metadata: {
          ...segment.metadata,
          profanityDetected: true,
        },
      };
    });

    return {
      ...state,
      segments,
    };
  },
});
