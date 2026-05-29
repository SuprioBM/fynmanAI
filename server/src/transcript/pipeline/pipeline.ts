/**
 * Pipeline composition for transcript preprocessing.
 */
import type { TranscriptInput, TranscriptState } from '../types.ts';
import type {
  TranscriptPipeline,
  TranscriptProcessor,
  TranscriptProcessorContext,
} from './types.ts';
import {
  addProcessingStep,
  createInitialState,
  toPipelineResult,
  updateSegments,
} from './state.ts';

const rebuildCleanedTextIfNeeded = (state: TranscriptState): TranscriptState =>
  updateSegments(state, state.segments);

export const createTranscriptPipeline = (
  processors: TranscriptProcessor[],
  context: TranscriptProcessorContext = {}
): TranscriptPipeline => ({
  processors,
  context,
  process: (input: TranscriptInput) => {
    let state = createInitialState(input);

    for (const processor of processors) {
      state = processor.apply(state, context);
      state = rebuildCleanedTextIfNeeded(state);
      state = addProcessingStep(state, processor.id);
    }

    return toPipelineResult(state);
  },
});
