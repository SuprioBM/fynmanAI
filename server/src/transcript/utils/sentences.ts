export type SentenceSpan = {
  text: string;
  start: number;
  end: number;
};

export const DEFAULT_ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'vs',
  'etc',
  'e.g',
  'i.e',
  'u.s',
  'u.k',
  'st',
]);

const isDecimalPoint = (text: string, index: number): boolean => {
  const prev = index > 0 ? text[index - 1] : '';
  const next = index + 1 < text.length ? text[index + 1] : '';
  return /\d/.test(prev) && /\d/.test(next);
};

const extractTokenBefore = (text: string, index: number): string => {
  let i = index - 1;
  while (i >= 0 && text[i] === ' ') {
    i -= 1;
  }

  let end = i + 1;
  while (i >= 0 && /[A-Za-z.]/.test(text[i])) {
    i -= 1;
  }

  return text.slice(i + 1, end).replace(/\.+$/, '');
};

const isAbbreviation = (token: string, abbreviations: Set<string>): boolean => {
  if (!token) {
    return false;
  }

  const lower = token.toLowerCase();
  if (abbreviations.has(lower)) {
    return true;
  }

  if (token.length === 1 && token.toUpperCase() === token) {
    return true;
  }

  return token.includes('.');
};

export const splitIntoSentences = (
  text: string,
  abbreviations: Set<string> = DEFAULT_ABBREVIATIONS
): SentenceSpan[] => {
  const spans: SentenceSpan[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '\n') {
      const segment = text.slice(start, i).trim();
      if (segment) {
        spans.push({ text: segment, start, end: i });
      }
      start = i + 1;
      continue;
    }

    if (char === '.' || char === '!' || char === '?') {
      if (char === '.' && isDecimalPoint(text, i)) {
        continue;
      }

      const token = extractTokenBefore(text, i);
      if (isAbbreviation(token, abbreviations)) {
        continue;
      }

      const nextChar = i + 1 < text.length ? text[i + 1] : '';
      if (nextChar && nextChar !== ' ' && nextChar !== '\n') {
        continue;
      }

      const segment = text.slice(start, i + 1).trim();
      if (segment) {
        spans.push({ text: segment, start, end: i + 1 });
      }

      start = i + 1;
    }
  }

  if (start < text.length) {
    const segment = text.slice(start).trim();
    if (segment) {
      spans.push({ text: segment, start, end: text.length });
    }
  }

  return spans.length
    ? spans
    : [{ text: text.trim(), start: 0, end: text.length }];
};
