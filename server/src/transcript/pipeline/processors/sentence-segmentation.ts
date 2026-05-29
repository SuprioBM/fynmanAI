/**
 * Sentence segmentation processor that preserves speaker boundaries.
 */
import type { TranscriptProcessor } from '../types.ts';
import type { TranscriptSegment, WordToken } from '../../types.ts';
import {
  splitIntoSentences,
  DEFAULT_ABBREVIATIONS,
} from '../../utils/sentences.ts';
import { tokenizeWords } from '../../utils/text.ts';
import { createId } from '../../utils/id.ts';

const normalizeAbbreviations = (
  abbreviations?: Set<string> | string[]
): Set<string> => {
  if (!abbreviations) {
    return DEFAULT_ABBREVIATIONS;
  }
  if (abbreviations instanceof Set) {
    return abbreviations;
  }
  return new Set(abbreviations.map(item => item.toLowerCase()));
};

const selectTokensForSpan = (
  segment: TranscriptSegment,
  span: { start: number; end: number }
): WordToken[] | undefined => {
  if (!segment.tokens?.length) {
    return undefined;
  }

  const wordSpans = tokenizeWords(segment.text);
  const tokens = segment.tokens;

  if (!wordSpans.length || !tokens.length) {
    return undefined;
  }

  if (tokens.length === wordSpans.length) {
    const selected: WordToken[] = [];
    for (let i = 0; i < wordSpans.length; i += 1) {
      const word = wordSpans[i];
      if (word.end <= span.start || word.start >= span.end) {
        continue;
      }
      selected.push(tokens[i]);
    }
    return selected.length ? selected : undefined;
  }

  const startRatio = span.start / Math.max(1, segment.text.length);
  const endRatio = span.end / Math.max(1, segment.text.length);
  const startIndex = Math.floor(startRatio * tokens.length);
  const endIndex = Math.ceil(endRatio * tokens.length);
  const selected = tokens.slice(startIndex, Math.max(startIndex + 1, endIndex));
  return selected.length ? selected : undefined;
};

const mapRawTextForSpan = (
  rawText: string,
  processedText: string,
  span: { start: number; end: number }
): string => {
  if (!rawText) {
    return processedText.slice(span.start, span.end).trim();
  }

  const processedTokens = tokenizeWords(processedText);
  const rawTokens = tokenizeWords(rawText);

  if (!processedTokens.length || !rawTokens.length) {
    const ratioStart = Math.floor(
      (span.start / Math.max(1, processedText.length)) * rawText.length
    );
    const ratioEnd = Math.ceil(
      (span.end / Math.max(1, processedText.length)) * rawText.length
    );
    return rawText.slice(ratioStart, ratioEnd).trim();
  }

  const tokenMap = new Map<number, number>();
  let rawIndex = 0;

  for (let i = 0; i < processedTokens.length; i += 1) {
    const target = processedTokens[i].text.toLowerCase();
    while (
      rawIndex < rawTokens.length &&
      rawTokens[rawIndex].text.toLowerCase() !== target
    ) {
      rawIndex += 1;
    }
    if (rawIndex < rawTokens.length) {
      tokenMap.set(i, rawIndex);
      rawIndex += 1;
    }
  }

  const processedIndices: number[] = [];
  for (let i = 0; i < processedTokens.length; i += 1) {
    const token = processedTokens[i];
    if (token.end <= span.start || token.start >= span.end) {
      continue;
    }
    processedIndices.push(i);
  }

  const first = processedIndices[0];
  const last = processedIndices[processedIndices.length - 1];

  if (first !== undefined && last !== undefined) {
    const rawStart = tokenMap.get(first);
    const rawEnd = tokenMap.get(last);
    if (rawStart !== undefined && rawEnd !== undefined) {
      return rawText
        .slice(rawTokens[rawStart].start, rawTokens[rawEnd].end)
        .trim();
    }
  }

  const ratioStart = Math.floor(
    (span.start / Math.max(1, processedText.length)) * rawText.length
  );
  const ratioEnd = Math.ceil(
    (span.end / Math.max(1, processedText.length)) * rawText.length
  );
  return rawText.slice(ratioStart, ratioEnd).trim();
};

const computeTimeRange = (
  segment: TranscriptSegment,
  tokens: WordToken[] | undefined,
  span: { start: number; end: number }
): { startMs?: number; endMs?: number } => {
  if (tokens?.length) {
    const startMs = tokens.find(token => token.startMs !== undefined)?.startMs;
    const endMs =
      [...tokens].reverse().find(token => token.endMs !== undefined)?.endMs ??
      startMs;
    return { startMs, endMs };
  }

  if (segment.startMs === undefined || segment.endMs === undefined) {
    return { startMs: segment.startMs, endMs: segment.endMs };
  }

  const totalLength = Math.max(1, segment.text.length);
  const startRatio = span.start / totalLength;
  const endRatio = span.end / totalLength;
  const duration = segment.endMs - segment.startMs;

  return {
    startMs: segment.startMs + duration * startRatio,
    endMs: segment.startMs + duration * endRatio,
  };
};

export const sentenceSegmentationProcessor = (): TranscriptProcessor => ({
  id: 'sentence-segmentation',
  apply: (state, context) => {
    const options = context.segmentation;
    if (options?.enabled === false) {
      return state;
    }

    const abbreviations = normalizeAbbreviations(options?.abbreviations);
    const nextSegments: TranscriptSegment[] = [];

    for (const segment of state.segments) {
      const sentences = splitIntoSentences(segment.text, abbreviations);
      if (sentences.length <= 1) {
        nextSegments.push(segment);
        continue;
      }

      for (const span of sentences) {
        const tokens = selectTokensForSpan(segment, span);
        const { startMs, endMs } = computeTimeRange(segment, tokens, span);
        const rawText = mapRawTextForSpan(segment.rawText, segment.text, span);

        nextSegments.push({
          ...segment,
          id: createId('segment'),
          text: span.text,
          rawText,
          startMs,
          endMs,
          tokens,
        });
      }
    }

    return {
      ...state,
      segments: nextSegments,
    };
  },
});
