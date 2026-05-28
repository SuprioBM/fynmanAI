type PreprocessOptions = {
  speakerLabel?: string;
  redactToken?: string;
  enableProfanityFilter?: boolean;
};

const FILLER_PHRASES = [
  'you know',
  'i mean',
  'kind of',
  'sort of',
  'basically',
  'actually',
  'literally',
];

const SINGLE_WORD_FILLERS = ['um', 'uh', 'erm', 'ah', 'hmm'];

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const SCALE_WORDS: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  million: 1000000,
  billion: 1000000000,
};

const PROFANITY_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'piss',
  'crap',
  'damn',
];

const NUMBER_WORD_LIST = Array.from(
  new Set([...Object.keys(NUMBER_WORDS), ...Object.keys(SCALE_WORDS)])
);
const NUMBER_SEQUENCE_PATTERN = `(?:${NUMBER_WORD_LIST.join('|')})(?:\\s+(?:${NUMBER_WORD_LIST.join('|')}|and))*`;
const NUMBER_SEQUENCE_REGEX = new RegExp(
  `\\b${NUMBER_SEQUENCE_PATTERN}\\b`,
  'gi'
);
const CURRENCY_REGEX = new RegExp(
  `\\b(${NUMBER_SEQUENCE_PATTERN})\\s+(?:bucks|dollars)\\b`,
  'gi'
);
const PROFANITY_REGEX = new RegExp(
  `\\b(?:${PROFANITY_WORDS.join('|')})\\b`,
  'gi'
);

const cleanSpacing = (text: string): string =>
  text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?=\S)/g, '$1 ')
    .trim();

const stripFillerWords = (text: string): string => {
  let result = text;

  for (const phrase of FILLER_PHRASES) {
    const phrasePattern = phrase.replace(/\s+/g, '\\s+');
    const regex = new RegExp(`(?:^|\\s)${phrasePattern}(?=\\s|[,.!?]|$)`, 'gi');
    result = result.replace(regex, ' ');
  }

  if (SINGLE_WORD_FILLERS.length) {
    const regex = new RegExp(
      `(?:^|\\s)(?:${SINGLE_WORD_FILLERS.join('|')})(?=\\s|[,.!?]|$)`,
      'gi'
    );
    result = result.replace(regex, ' ');
  }

  result = result.replace(/(?:^|\s)like(?=\s*[,.;:!?]|$)/gi, ' ');

  return cleanSpacing(result);
};

const repairStutterAndFalseStarts = (text: string): string => {
  let result = text;

  result = result.replace(/\b([a-z]+)(?:-|\u2013|\u2014)\s+(?=\w)/gi, '');

  const stutterRegex = /\b([a-z]+)(?:[\s,]+\1\b)+/gi;
  while (stutterRegex.test(result)) {
    result = result.replace(stutterRegex, '$1');
  }

  return cleanSpacing(result);
};

const parseNumberWords = (input: string): number | null => {
  const tokens = input
    .toLowerCase()
    .split(/\s+/)
    .filter(token => token && token !== 'and');

  let total = 0;
  let current = 0;
  let sawNumber = false;

  for (const token of tokens) {
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
      continue;
    }

    return null;
  }

  return sawNumber ? total + current : null;
};

const normalizeNumbers = (text: string): string => {
  let result = text.replace(CURRENCY_REGEX, (match, numberWords: string) => {
    const parsed = parseNumberWords(numberWords);
    if (parsed === null) {
      return match;
    }
    return `$${parsed}`;
  });

  result = result.replace(NUMBER_SEQUENCE_REGEX, match => {
    const parsed = parseNumberWords(match);
    if (parsed === null) {
      return match;
    }
    return String(parsed);
  });

  return result;
};

const filterProfanity = (
  text: string,
  redactToken: string,
  enabled: boolean
): string => {
  if (!enabled) {
    return text;
  }

  return text.replace(PROFANITY_REGEX, redactToken);
};

const normalizeSpeakerLabel = (label?: string): string | undefined => {
  if (!label) {
    return undefined;
  }

  const trimmed = label.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;
};

const insertSpeakerLabel = (text: string, label?: string): string => {
  const normalizedLabel = normalizeSpeakerLabel(label);
  const trimmed = text.trim();

  if (!trimmed || !normalizedLabel) {
    return trimmed;
  }

  const lowerLabel = normalizedLabel.toLowerCase();
  if (trimmed.toLowerCase().startsWith(`${lowerLabel}:`)) {
    return trimmed;
  }

  return `${normalizedLabel}: ${trimmed}`;
};

export const preprocessTranscriptText = (
  text: string,
  options: PreprocessOptions = {}
): string => {
  const redactToken = options.redactToken?.trim() || '[redacted]';
  const enableProfanityFilter = options.enableProfanityFilter ?? true;

  let result = text || '';
  result = stripFillerWords(result);
  result = repairStutterAndFalseStarts(result);
  result = normalizeNumbers(result);
  result = filterProfanity(result, redactToken, enableProfanityFilter);
  result = cleanSpacing(result);
  result = insertSpeakerLabel(result, options.speakerLabel);

  return result.trim();
};
