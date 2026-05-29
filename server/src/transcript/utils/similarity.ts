export const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) {
    return 0;
  }

  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) {
    return bLen;
  }

  if (bLen === 0) {
    return aLen;
  }

  const matrix = Array.from({ length: aLen + 1 }, () => new Array(bLen + 1));

  for (let i = 0; i <= aLen; i += 1) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= bLen; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= aLen; i += 1) {
    for (let j = 1; j <= bLen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[aLen][bLen];
};

export const similarityScore = (a: string, b: string): number => {
  if (!a && !b) {
    return 1;
  }

  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - distance / maxLen;
};
