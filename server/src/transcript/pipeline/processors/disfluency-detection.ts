/**
 * Disfluency detection processor (stutters, false starts, self-corrections).
 */
import type { TranscriptProcessor } from '../types.ts';
import { tokenizeWords } from '../../utils/text.ts';

const STUTTER_PATTERN = /(\b\w+)(?:\s*[-\u2013\u2014]\s*\1)+/i;

const SELF_CORRECTION_MARKERS: Array<string[]> = [
  ['sorry'],
  ['i', 'mean'],
  ['rather'],
  ['correction'],
];

const detectStutter = (text: string): boolean => {
  if (STUTTER_PATTERN.test(text)) {
    return true;
  }

  const tokens = tokenizeWords(text).map(span => span.text.toLowerCase());
  for (let i = 1; i < tokens.length; i += 1) {
    if (tokens[i] && tokens[i] === tokens[i - 1]) {
      return true;
    }
  }

  return false;
};

const detectFalseStart = (text: string): boolean =>
  /--|\u2014|\u2013|\.\.\./.test(text);

const detectSelfCorrections = (
  text: string
): Array<{ from: string; to: string }> => {
  const tokens = tokenizeWords(text).map(span => span.text);
  const lower = tokens.map(token => token.toLowerCase());
  const corrections: Array<{ from: string; to: string }> = [];

  for (const marker of SELF_CORRECTION_MARKERS) {
    const markerLength = marker.length;

    for (let i = 0; i <= lower.length - markerLength; i += 1) {
      const candidate = lower.slice(i, i + markerLength).join(' ');
      if (candidate !== marker.join(' ')) {
        continue;
      }

      const before = tokens
        .slice(Math.max(0, i - 3), i)
        .join(' ')
        .trim();
      const after = tokens
        .slice(i + markerLength, i + markerLength + 3)
        .join(' ')
        .trim();

      if (before && after) {
        corrections.push({ from: before, to: after });
      }
    }
  }

  return corrections;
};

export const disfluencyDetectionProcessor = (): TranscriptProcessor => ({
  id: 'disfluency-detection',
  apply: (state, context) => {
    const options = context.disfluency;
    if (options?.enabled === false) {
      return state;
    }

    const segments = state.segments.map(segment => {
      const stutterDetected =
        (options?.detectStutters ?? true) ? detectStutter(segment.text) : false;
      const falseStartDetected =
        (options?.detectFalseStarts ?? true)
          ? detectFalseStart(segment.text)
          : false;
      const corrections =
        (options?.detectSelfCorrections ?? true)
          ? detectSelfCorrections(segment.text)
          : [];

      const disfluenciesDetected =
        stutterDetected || falseStartDetected || corrections.length > 0;

      if (!disfluenciesDetected) {
        return segment;
      }

      const metadataCorrections = corrections.map(correction => ({
        from: correction.from,
        to: correction.to,
        reason: 'self-correction',
      }));

      return {
        ...segment,
        metadata: {
          ...segment.metadata,
          disfluenciesDetected,
          corrections: [
            ...(segment.metadata?.corrections ?? []),
            ...metadataCorrections,
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
