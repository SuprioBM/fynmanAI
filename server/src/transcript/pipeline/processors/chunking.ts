/**
 * Semantic chunking processor for LLM ingestion.
 */
import type { TranscriptProcessor } from '../types.ts';
import type { TranscriptChunk, TranscriptSegment } from '../../types.ts';
import { countWordTokens } from '../../utils/text.ts';
import { createId } from '../../utils/id.ts';

const buildChunkText = (
  segments: TranscriptSegment[],
  includeSpeakerLabels: boolean
): string =>
  segments
    .map(segment => {
      if (includeSpeakerLabels && segment.speaker) {
        return `${segment.speaker}: ${segment.text}`.trim();
      }
      return segment.text;
    })
    .join('\n')
    .trim();

export const chunkingProcessor = (): TranscriptProcessor => ({
  id: 'chunking',
  apply: (state, context) => {
    const options = context.chunking;
    if (options?.enabled === false) {
      return state;
    }

    const maxTokens = options?.maxTokens ?? 220;
    const minTokens = options?.minTokens ?? 40;
    const maxSegments = options?.maxSegments ?? 12;
    const includeSpeakerLabels = options?.includeSpeakerLabels ?? true;
    const splitOnSpeakerChange = options?.splitOnSpeakerChange ?? true;

    const chunks: TranscriptChunk[] = [];
    let currentSegments: TranscriptSegment[] = [];
    let currentTokenCount = 0;

    const flush = () => {
      if (!currentSegments.length) {
        return;
      }

      const speakers = Array.from(
        new Set(currentSegments.map(segment => segment.speaker).filter(Boolean))
      ) as string[];
      const startMs = currentSegments[0].startMs;
      const endMs = currentSegments[currentSegments.length - 1].endMs;

      chunks.push({
        id: createId('chunk'),
        text: buildChunkText(currentSegments, includeSpeakerLabels),
        startMs,
        endMs,
        speakers,
        segmentIds: currentSegments.map(segment => segment.id),
      });

      currentSegments = [];
      currentTokenCount = 0;
    };

    for (const segment of state.segments) {
      const segmentTokens = countWordTokens(segment.text);
      const nextTokenCount = currentTokenCount + segmentTokens;
      const lastSpeaker = currentSegments[currentSegments.length - 1]?.speaker;

      const shouldSplitForSpeaker =
        splitOnSpeakerChange &&
        lastSpeaker &&
        segment.speaker &&
        segment.speaker !== lastSpeaker &&
        currentTokenCount >= minTokens;

      const shouldSplitForSize = nextTokenCount > maxTokens;
      const shouldSplitForSegments = currentSegments.length >= maxSegments;

      if (
        currentSegments.length &&
        (shouldSplitForSpeaker || shouldSplitForSize || shouldSplitForSegments)
      ) {
        flush();
      }

      currentSegments.push(segment);
      currentTokenCount += segmentTokens;
    }

    flush();

    return {
      ...state,
      chunks,
    };
  },
});
