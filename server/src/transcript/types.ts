/**
 * Token-level representation of a transcript word.
 */
export type WordToken = {
  text: string;
  startMs?: number;
  endMs?: number;
  confidence?: number;
  speaker?: string;
};

/**
 * A semantically meaningful segment of a transcript.
 */
export type TranscriptSegment = {
  id: string;
  speaker?: string;
  text: string;
  rawText: string;
  startMs?: number;
  endMs?: number;
  confidence?: number;
  tokens?: WordToken[];

  metadata?: {
    fillersRemoved?: string[];
    corrections?: Array<{
      from: string;
      to: string;
      reason: string;
    }>;

    lowConfidenceSpans?: Array<{
      text: string;
      confidence: number;
    }>;

    profanityDetected?: boolean;
    disfluenciesDetected?: boolean;
  };
};

/**
 * LLM-ready transcript output with audit metadata.
 */
export type ProcessedTranscript = {
  raw: string;
  cleanedText: string;
  segments: TranscriptSegment[];
  language?: string;

  metadata?: {
    processingSteps: string[];
    warnings: string[];
  };
};

/**
 * A chunk of transcript intended for LLM ingestion.
 */
export type TranscriptChunk = {
  id: string;
  text: string;
  startMs?: number;
  endMs?: number;
  speakers: string[];
  segmentIds: string[];
};

/**
 * Input shape for pipeline processing.
 */
export type TranscriptInput = {
  raw: string;
  language?: string;
  speaker?: string;
  tokens?: WordToken[];
  segments?: Array<
    Omit<TranscriptSegment, 'id' | 'rawText' | 'text'> & {
      id?: string;
      text: string;
      rawText?: string;
    }
  >;
};

/**
 * Pipeline result with chunks attached.
 */
export type TranscriptPipelineResult = ProcessedTranscript & {
  chunks: TranscriptChunk[];
};

/**
 * Internal pipeline state.
 */
export type TranscriptState = {
  raw: string;
  segments: TranscriptSegment[];
  cleanedText: string;
  language?: string;
  chunks: TranscriptChunk[];
  metadata: {
    processingSteps: string[];
    warnings: string[];
  };
};
