/**
 * Filler detection processor (non-destructive).
 */
import type { TranscriptProcessor } from '../types.ts';
import {
  normalizePunctuationSpacing,
  normalizeWhitespace,
  tokenizeWords,
} from '../../utils/text.ts';
import {
  applyReplacements,
  filterOverlappingReplacements,
  type TextReplacement,
} from '../../utils/replacements.ts';

const DEFAULT_FILLER_PHRASES = [
  'you know',
  'i mean',
  'kind of',
  'sort of',
  'basically',
  'actually',
  'literally',
];

const DEFAULT_SINGLE_WORD_FILLERS = ['um', 'uh', 'erm', 'ah', 'hmm'];

const buildPhraseTokens = (phrases: string[]): string[][] =>
  phrases.map(phrase => phrase.toLowerCase().split(/\s+/).filter(Boolean));

export const fillerDetectionProcessor = (): TranscriptProcessor => ({
  id: 'filler-detection',
  apply: (state, context) => {
    const options = context.fillers;
    if (options?.enabled === false) {
      return state;
    }

    const singleWordFillers = new Set(
      (options?.singleWordFillers ?? DEFAULT_SINGLE_WORD_FILLERS).map(word =>
        word.toLowerCase()
      )
    );
    const phraseFillers = options?.phraseFillers ?? DEFAULT_FILLER_PHRASES;
    const phraseTokens = buildPhraseTokens(phraseFillers);
    const mode = options?.mode ?? 'annotate';

    const segments = state.segments.map(segment => {
      const wordSpans = tokenizeWords(segment.text);
      if (!wordSpans.length) {
        return segment;
      }

      const tokens = wordSpans.map(span => span.text.toLowerCase());
      const matches: Array<{ start: number; end: number; text: string }> = [];

      for (const [phraseIndex, phrase] of phraseTokens.entries()) {
        const length = phrase.length;
        if (!length) {
          continue;
        }

        for (let i = 0; i <= tokens.length - length; i += 1) {
          const candidate = tokens.slice(i, i + length).join(' ');
          if (candidate === phrase.join(' ')) {
            matches.push({
              start: wordSpans[i].start,
              end: wordSpans[i + length - 1].end,
              text: phraseFillers[phraseIndex],
            });
          }
        }
      }

      for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        if (singleWordFillers.has(token)) {
          matches.push({
            start: wordSpans[i].start,
            end: wordSpans[i].end,
            text: wordSpans[i].text,
          });
        }
      }

      if (!matches.length) {
        return segment;
      }

      const fillersRemoved = Array.from(
        new Set(matches.map(match => match.text))
      );

      let text = segment.text;
      if (mode === 'remove') {
        const replacements: TextReplacement[] = matches.map(match => ({
          start: match.start,
          end: match.end,
          text: '',
        }));
        const filtered = filterOverlappingReplacements(replacements);
        text = applyReplacements(text, filtered);
        text = normalizeWhitespace(normalizePunctuationSpacing(text));
      }

      return {
        ...segment,
        text,
        metadata: {
          ...segment.metadata,
          fillersRemoved,
        },
      };
    });

    return {
      ...state,
      segments,
    };
  },
});
