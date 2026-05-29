import { processTranscript } from '#src/transcript/pipeline/index.ts';
import type { TranscriptInput } from '#src/transcript/types.ts';

describe('transcript pipeline', () => {
  test('normalizes spacing and repeated punctuation safely', () => {
    const result = processTranscript(
      { raw: 'Hello   WORLD!!!!!' },
      { normalization: { maxRepeatedPunctuation: 2 } }
    );

    expect(result.cleanedText).toBe('Hello WORLD!!');
  });

  test('detects fillers and optionally removes them', () => {
    const result = processTranscript(
      { raw: 'um I think basically this works' },
      { fillers: { mode: 'remove' } }
    );

    expect(result.segments[0].metadata?.fillersRemoved).toEqual(
      expect.arrayContaining(['um', 'basically'])
    );
    expect(result.cleanedText).toBe('I think this works');
  });

  test('detects disfluencies and can lightly repair stutters', () => {
    const result = processTranscript(
      { raw: 'I-I-I think this is good' },
      { semanticRepair: { mode: 'light' } }
    );

    expect(result.segments[0].metadata?.disfluenciesDetected).toBe(true);
    expect(result.cleanedText).toBe('I think this is good');
  });

  test('annotates low confidence spans from tokens', () => {
    const input: TranscriptInput = {
      raw: 'hello world',
      tokens: [
        { text: 'hello', confidence: 0.42 },
        { text: 'world', confidence: 0.92 },
      ],
    };

    const result = processTranscript(input, { confidence: { threshold: 0.5 } });
    expect(result.segments[0].metadata?.lowConfidenceSpans).toEqual([
      { text: 'hello', confidence: 0.42 },
    ]);
  });

  test('normalizes spoken numbers conservatively', () => {
    const result = processTranscript({
      raw: 'We shipped twenty twenty four updates and minus seven fixes',
    });

    expect(result.cleanedText).toContain('2024');
    expect(result.cleanedText).toContain('-7');
  });

  test('applies domain corrections and profanity mode', () => {
    const result = processTranscript(
      { raw: 'We used lang chain and this is shit' },
      {
        domain: {
          dictionary: { 'lang chain': 'LangChain' },
        },
        profanity: { mode: 'mask', maskToken: '[redacted]' },
      }
    );

    expect(result.cleanedText).toContain('LangChain');
    expect(result.cleanedText).toContain('[redacted]');
    expect(result.segments[0].metadata?.profanityDetected).toBe(true);
  });

  test('chunks by speaker boundaries when configured', () => {
    const input: TranscriptInput = {
      raw: 'A: Hello\nB: Hi',
      segments: [
        { text: 'Hello there', rawText: 'Hello there', speaker: 'A' },
        { text: 'Hi again', rawText: 'Hi again', speaker: 'B' },
      ],
    };

    const result = processTranscript(input, {
      segmentation: { enabled: false },
      chunking: { maxTokens: 5, minTokens: 1, splitOnSpeakerChange: true },
    });

    expect(result.chunks.length).toBe(2);
    expect(result.chunks[0].speakers).toEqual(['A']);
    expect(result.chunks[1].speakers).toEqual(['B']);
  });
});
