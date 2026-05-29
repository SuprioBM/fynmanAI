export type WordSpan = {
  text: string;
  start: number;
  end: number;
};

export const normalizeUnicode = (
  text: string,
  form: 'NFKC' | 'NFC' | 'NFD' | 'NFKD' | 'none'
): string => {
  if (form === 'none') {
    return text;
  }

  return text.normalize(form);
};

export const normalizeWhitespace = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();

export const normalizePunctuationSpacing = (text: string): string => {
  const trimmed = text.replace(/\s+([,.;:!?])/g, '$1');
  return trimmed.replace(/([,.;:!?])(?=[^\s,.;:!?])/g, '$1 ');
};

export const normalizeRepeatedPunctuation = (
  text: string,
  maxRepeat: number
): string =>
  text.replace(/([!?.,])\1{2,}/g, match =>
    match.slice(0, Math.min(maxRepeat, match.length))
  );

const isLetterOrDigit = (char: string): boolean => {
  if (!char) {
    return false;
  }

  const code = char.charCodeAt(0);
  if (code >= 48 && code <= 57) {
    return true;
  }

  return char.toLowerCase() !== char.toUpperCase();
};

const isWordChar = (char: string, prevChar?: string): boolean => {
  if (isLetterOrDigit(char)) {
    return true;
  }

  if (char === "'") {
    return Boolean(prevChar && isLetterOrDigit(prevChar));
  }

  return false;
};

export const tokenizeWords = (text: string): WordSpan[] => {
  const tokens: WordSpan[] = [];
  let start: number | null = null;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : undefined;
    const isWord = isWordChar(char, prevChar);

    if (isWord && start === null) {
      start = i;
      continue;
    }

    if (!isWord && start !== null) {
      tokens.push({ text: text.slice(start, i), start, end: i });
      start = null;
    }
  }

  if (start !== null) {
    tokens.push({ text: text.slice(start), start, end: text.length });
  }

  return tokens;
};

export const removeRanges = (
  text: string,
  ranges: Array<{ start: number; end: number }>
): string => {
  if (!ranges.length) {
    return text;
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let result = '';
  let cursor = 0;

  for (const range of sorted) {
    if (range.start > cursor) {
      result += text.slice(cursor, range.start);
    }

    cursor = Math.max(cursor, range.end);
  }

  if (cursor < text.length) {
    result += text.slice(cursor);
  }

  return result;
};

export const countWordTokens = (text: string): number =>
  tokenizeWords(text).length;
