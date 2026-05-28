/**
 * Spoken number normalization processor.
 */
import type { TranscriptProcessor } from '../types.ts';
import { tokenizeWords, normalizeWhitespace } from '../../utils/text.ts';
import {
  applyReplacements,
  filterOverlappingReplacements,
  type TextReplacement,
} from '../../utils/replacements.ts';
import {
  DIGIT_WORDS,
  NUMBER_WORDS,
  ORDINAL_WORDS,
  SCALE_WORDS,
  YEAR_PREFIXES,
  formatOrdinal,
} from '../../utils/numbers.ts';

const DECIMAL_MARKERS = new Set(['point', 'dot', 'decimal']);
const NEGATIVE_MARKERS = new Set(['minus', 'negative']);
const CURRENCY_WORDS = new Set(['dollars', 'bucks', 'usd']);
const PERCENT_WORDS = new Set(['percent', 'percentage']);

type ParsedNumber = {
  normalized: string;
  endIndex: number;
  ambiguous?: boolean;
};

const isDigitWord = (word: string): boolean =>
  Object.prototype.hasOwnProperty.call(DIGIT_WORDS, word);

const isNumberWord = (word: string): boolean =>
  Object.prototype.hasOwnProperty.call(NUMBER_WORDS, word) ||
  Object.prototype.hasOwnProperty.call(SCALE_WORDS, word) ||
  word === 'and';

const parseDigitSequence = (
  tokens: string[],
  startIndex: number,
  minDigits: number
): { digits: string; endIndex: number; ambiguous: boolean } | null => {
  let digits = '';
  let index = startIndex;

  while (index < tokens.length && isDigitWord(tokens[index])) {
    digits += String(DIGIT_WORDS[tokens[index]]);
    index += 1;
  }

  if (!digits) {
    return null;
  }

  const ambiguous = digits.length < minDigits;
  return { digits, endIndex: index, ambiguous };
};

const parseCardinalSequence = (
  tokens: string[],
  startIndex: number
): { value: number; endIndex: number } | null => {
  let total = 0;
  let current = 0;
  let index = startIndex;
  let sawNumber = false;

  while (index < tokens.length && isNumberWord(tokens[index])) {
    const token = tokens[index];
    index += 1;

    if (token === 'and') {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, token)) {
      current += NUMBER_WORDS[token];
      sawNumber = true;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(SCALE_WORDS, token)) {
      const scale = SCALE_WORDS[token];
      if (current === 0) {
        current = 1;
      }
      if (scale >= 1000) {
        total += current * scale;
        current = 0;
      } else {
        current *= scale;
      }
      sawNumber = true;
    }
  }

  if (!sawNumber) {
    return null;
  }

  return { value: total + current, endIndex: index };
};

const parseTwoDigitSequence = (
  tokens: string[],
  startIndex: number
): { value: number; endIndex: number } | null => {
  let value = 0;
  let index = startIndex;

  if (index >= tokens.length) {
    return null;
  }

  const first = tokens[index];
  if (!Object.prototype.hasOwnProperty.call(NUMBER_WORDS, first)) {
    return null;
  }

  value += NUMBER_WORDS[first];
  index += 1;

  if (
    index < tokens.length &&
    Object.prototype.hasOwnProperty.call(NUMBER_WORDS, tokens[index])
  ) {
    const nextValue = NUMBER_WORDS[tokens[index]];
    if (nextValue < 10) {
      value += nextValue;
      index += 1;
    }
  }

  return { value, endIndex: index };
};

const parseYearSequence = (
  tokens: string[],
  startIndex: number,
  _prevToken: string | undefined
): ParsedNumber | null => {
  const prefix = YEAR_PREFIXES[tokens[startIndex]];
  if (!prefix) {
    return null;
  }

  const suffix = parseTwoDigitSequence(tokens, startIndex + 1);
  if (!suffix) {
    return null;
  }

  const year = prefix + suffix.value;
  return {
    normalized: String(year),
    endIndex: suffix.endIndex,
    ambiguous: false,
  };
};

const parseOrdinal = (
  tokens: string[],
  startIndex: number
): ParsedNumber | null => {
  const value = ORDINAL_WORDS[tokens[startIndex]];
  if (!value) {
    return null;
  }

  return {
    normalized: formatOrdinal(value),
    endIndex: startIndex + 1,
  };
};

const parseDecimalSequence = (
  tokens: string[],
  startIndex: number
): ParsedNumber | null => {
  const cardinal = parseCardinalSequence(tokens, startIndex);
  if (cardinal && DECIMAL_MARKERS.has(tokens[cardinal.endIndex])) {
    const decimals = parseDigitSequence(tokens, cardinal.endIndex + 1, 1);
    if (decimals) {
      return {
        normalized: `${cardinal.value}.${decimals.digits}`,
        endIndex: decimals.endIndex,
      };
    }
  }

  const digits = parseDigitSequence(tokens, startIndex, 1);
  if (digits && DECIMAL_MARKERS.has(tokens[digits.endIndex])) {
    const decimals = parseDigitSequence(tokens, digits.endIndex + 1, 1);
    if (decimals) {
      return {
        normalized: `${digits.digits}.${decimals.digits}`,
        endIndex: decimals.endIndex,
      };
    }
  }

  return null;
};

const applyCurrencyOrPercent = (
  normalized: string,
  tokens: string[],
  endIndex: number,
  allowCurrency: boolean,
  allowPercent: boolean
): { normalized: string; endIndex: number } => {
  if (allowCurrency && CURRENCY_WORDS.has(tokens[endIndex])) {
    const numeric = normalized.startsWith('-')
      ? normalized.slice(1)
      : normalized;
    const signed = normalized.startsWith('-') ? `-$${numeric}` : `$${numeric}`;
    return { normalized: signed, endIndex: endIndex + 1 };
  }

  if (allowPercent && PERCENT_WORDS.has(tokens[endIndex])) {
    return { normalized: `${normalized}%`, endIndex: endIndex + 1 };
  }

  return { normalized, endIndex };
};

export const numberNormalizationProcessor = (): TranscriptProcessor => ({
  id: 'number-normalization',
  apply: (state, context) => {
    const options = context.numbers;
    if (options?.enabled === false) {
      return state;
    }

    const mode = options?.mode ?? 'conservative';
    const allowYear = options?.allowYearNormalization ?? true;
    const allowOrdinal = options?.allowOrdinalNormalization ?? true;
    const allowCurrency = options?.allowCurrencyNormalization ?? true;
    const allowPercent = options?.allowPercentNormalization ?? true;
    const allowDigits = options?.allowDigitSequence ?? true;
    const minDigits = options?.minDigitsForSequence ?? 3;
    const convertSingleNumbers = options?.convertSingleNumbers ?? false;

    const warnings: string[] = [];

    const segments = state.segments.map(segment => {
      const wordSpans = tokenizeWords(segment.text);
      if (!wordSpans.length) {
        return segment;
      }

      const tokens = wordSpans.map(span => span.text.toLowerCase());
      const replacements: TextReplacement[] = [];
      const corrections: Array<{ from: string; to: string; reason: string }> =
        [];

      let index = 0;
      while (index < tokens.length) {
        let tokenIndex = index;
        let sign = '';

        if (NEGATIVE_MARKERS.has(tokens[tokenIndex])) {
          sign = '-';
          tokenIndex += 1;
        }

        if (tokenIndex >= tokens.length) {
          break;
        }

        const prevToken = tokenIndex > 0 ? tokens[tokenIndex - 1] : undefined;
        let parsed: ParsedNumber | null = null;

        if (allowOrdinal) {
          parsed = parseOrdinal(tokens, tokenIndex);
        }

        if (!parsed && allowYear) {
          parsed = parseYearSequence(tokens, tokenIndex, prevToken);
        }

        if (!parsed) {
          parsed = parseDecimalSequence(tokens, tokenIndex);
        }

        if (!parsed && allowDigits) {
          const digitMinDigits = sign ? 1 : minDigits;
          const digits = parseDigitSequence(tokens, tokenIndex, digitMinDigits);
          if (digits) {
            parsed = {
              normalized: digits.digits,
              endIndex: digits.endIndex,
              ambiguous: digits.ambiguous,
            };
          }
        }

        if (!parsed) {
          const cardinal = parseCardinalSequence(tokens, tokenIndex);
          if (cardinal) {
            parsed = {
              normalized: String(cardinal.value),
              endIndex: cardinal.endIndex,
              ambiguous:
                !sign &&
                !convertSingleNumbers &&
                cardinal.endIndex - tokenIndex === 1,
            };
          }
        }

        if (!parsed) {
          index += 1;
          continue;
        }

        let normalized = sign
          ? `${sign}${parsed.normalized}`
          : parsed.normalized;
        let endIndex = parsed.endIndex;

        if (allowCurrency || allowPercent) {
          const formatted = applyCurrencyOrPercent(
            normalized,
            tokens,
            endIndex,
            allowCurrency,
            allowPercent
          );
          normalized = formatted.normalized;
          endIndex = formatted.endIndex;
        }

        const fromText = segment.text.slice(
          wordSpans[index].start,
          wordSpans[endIndex - 1].end
        );

        const isAmbiguous = parsed.ambiguous && mode === 'conservative';
        if (isAmbiguous) {
          warnings.push(`Skipped ambiguous number phrase "${fromText}"`);
          index += 1;
          continue;
        }

        replacements.push({
          start: wordSpans[index].start,
          end: wordSpans[endIndex - 1].end,
          text: normalized,
        });
        corrections.push({
          from: fromText,
          to: normalized,
          reason: 'number-normalization',
        });

        index = endIndex;
      }

      if (!replacements.length) {
        return segment;
      }

      const filtered = filterOverlappingReplacements(replacements);
      let text = applyReplacements(segment.text, filtered);
      text = normalizeWhitespace(text);

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

    const uniqueWarnings = Array.from(new Set(warnings));
    const metadata = state.metadata;

    return {
      ...state,
      segments,
      metadata: {
        ...metadata,
        warnings: [...metadata.warnings, ...uniqueWarnings],
      },
    };
  },
});
