/**
 * Speaker label normalization and merging processor.
 */
import type { TranscriptProcessor } from '../types.ts';
import type { WordToken } from '../../types.ts';

const normalizeLabel = (label?: string): string | undefined => {
  if (!label) {
    return undefined;
  }

  const trimmed = label.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;
};

const mapSpeaker = (
  label: string | undefined,
  map: Record<string, string> | undefined,
  fallback?: string
): string | undefined => {
  const normalized = normalizeLabel(label) ?? normalizeLabel(fallback);
  if (!normalized) {
    return undefined;
  }

  const mapped = map?.[normalized] ?? map?.[normalized.toLowerCase()];
  return mapped ?? normalized;
};

const updateTokenSpeaker = (
  token: WordToken,
  speaker: string | undefined
): WordToken => ({
  ...token,
  speaker: speaker ?? token.speaker,
});

export const speakerProcessor = (): TranscriptProcessor => ({
  id: 'speaker',
  apply: (state, context) => {
    const options = context.speaker;
    if (options?.enabled === false) {
      return state;
    }

    const speakerMap = options?.speakerMap;
    const defaultSpeaker = options?.defaultSpeaker;

    const segments = state.segments.map(segment => {
      const speaker = mapSpeaker(segment.speaker, speakerMap, defaultSpeaker);

      return {
        ...segment,
        speaker,
        tokens: segment.tokens?.map(token =>
          updateTokenSpeaker(token, speaker)
        ),
      };
    });

    return {
      ...state,
      segments,
    };
  },
});
