/**
 * Text replacement helpers that preserve offsets.
 */
export type TextReplacement = {
  start: number;
  end: number;
  text: string;
};

export const filterOverlappingReplacements = (
  replacements: TextReplacement[]
): TextReplacement[] => {
  if (!replacements.length) {
    return [];
  }

  const sorted = [...replacements].sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return b.end - b.start - (a.end - a.start);
  });

  const result: TextReplacement[] = [];
  let lastEnd = -1;

  for (const replacement of sorted) {
    if (replacement.start >= lastEnd) {
      result.push(replacement);
      lastEnd = replacement.end;
    }
  }

  return result;
};

export const applyReplacements = (
  text: string,
  replacements: TextReplacement[]
): string => {
  if (!replacements.length) {
    return text;
  }

  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let result = text;

  for (const replacement of sorted) {
    result =
      result.slice(0, replacement.start) +
      replacement.text +
      result.slice(replacement.end);
  }

  return result;
};
