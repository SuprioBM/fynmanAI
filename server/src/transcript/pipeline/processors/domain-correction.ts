/**
 * Domain correction processor with fuzzy matching support.
 */
import type { TranscriptProcessor } from '../types.ts';
import { tokenizeWords, normalizeWhitespace } from '../../utils/text.ts';
import {
  applyReplacements,
  filterOverlappingReplacements,
  type TextReplacement,
} from '../../utils/replacements.ts';
import { similarityScore } from '../../utils/similarity.ts';

const buildDictionaryEntries = (dictionary?: Record<string, string>) =>
  Object.entries(dictionary ?? {}).filter(
    ([key, value]) => key.trim().length > 0 && value.trim().length > 0
  );

const hasLowConfidenceOverlap = (
  candidate: string,
  lowConfidenceSpans: Array<{ text: string }>
): boolean => {
  const candidateLower = candidate.toLowerCase();
  return lowConfidenceSpans.some(span => {
    const spanLower = span.text.toLowerCase();
    return (
      candidateLower.includes(spanLower) || spanLower.includes(candidateLower)
    );
  });
};

export const domainCorrectionProcessor = (): TranscriptProcessor => ({
  id: 'domain-correction',
  apply: (state, context) => {
    const options = context.domain;
    if (options?.enabled === false) {
      return state;
    }

    const entries = buildDictionaryEntries(options?.dictionary);
    if (!entries.length) {
      return state;
    }

    const fuzzyThreshold = options?.fuzzyThreshold ?? 0.9;
    const allowOnLowConfidence = options?.allowOnLowConfidence ?? false;
    const maxCorrections = options?.maxCorrections ?? 25;

    const segments = state.segments.map(segment => {
      const wordSpans = tokenizeWords(segment.text);
      if (!wordSpans.length) {
        return segment;
      }

      const tokens = wordSpans.map(span => span.text.toLowerCase());
      const replacements: TextReplacement[] = [];

      for (const [from, to] of entries) {
        const keyTokens = from.toLowerCase().split(/\s+/).filter(Boolean);
        const length = keyTokens.length;
        if (!length) {
          continue;
        }

        for (let i = 0; i <= tokens.length - length; i += 1) {
          const candidate = tokens.slice(i, i + length).join(' ');
          if (candidate === from.toLowerCase()) {
            replacements.push({
              start: wordSpans[i].start,
              end: wordSpans[i + length - 1].end,
              text: to,
            });
            continue;
          }

          if (fuzzyThreshold < 1) {
            const score = similarityScore(candidate, from.toLowerCase());
            if (score >= fuzzyThreshold) {
              replacements.push({
                start: wordSpans[i].start,
                end: wordSpans[i + length - 1].end,
                text: to,
              });
            }
          }
        }
      }

      if (!replacements.length) {
        return segment;
      }

      const lowConfidenceSpans = segment.metadata?.lowConfidenceSpans ?? [];
      const filtered = filterOverlappingReplacements(replacements).filter(
        replacement =>
          allowOnLowConfidence ||
          !hasLowConfidenceOverlap(
            segment.text.slice(replacement.start, replacement.end),
            lowConfidenceSpans
          )
      );

      const limited = filtered.slice(0, maxCorrections);
      if (!limited.length) {
        return segment;
      }

      let text = applyReplacements(segment.text, limited);
      text = normalizeWhitespace(text);

      const corrections = limited.map(replacement => ({
        from: segment.text.slice(replacement.start, replacement.end),
        to: replacement.text,
        reason: 'domain-correction',
      }));

      return {
        ...segment,
        text,
        metadata: {
          ...segment.metadata,
          corrections: [
            ...(segment.metadata?.corrections ?? []),
            ...corrections,
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
