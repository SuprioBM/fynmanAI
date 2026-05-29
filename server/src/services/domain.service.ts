import { env } from '#config/env.ts';

type DomainScope = {
  subject?: string;
  topic?: string;
  goal?: string;
};

const DEFAULT_ALLOWED_SUBJECTS = ['math', 'physics'];

const parseAllowedSubjects = (): string[] => {
  const raw = env.DOMAIN_ALLOWED_SUBJECTS;
  if (!raw) {
    return DEFAULT_ALLOWED_SUBJECTS;
  }

  const values = raw
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  return values.length ? values : DEFAULT_ALLOWED_SUBJECTS;
};

export const normalizeDomainScope = (scope: DomainScope): DomainScope => {
  const allowed = parseAllowedSubjects();
  const normalizedSubject = scope.subject?.trim().toLowerCase();
  const normalizedTopic = scope.topic?.trim();
  const normalizedGoal = scope.goal?.trim();

  if (normalizedSubject && !allowed.includes(normalizedSubject)) {
    throw new Error(
      `Unsupported subject: ${scope.subject}. Allowed subjects: ${allowed.join(', ')}`
    );
  }

  return {
    subject: normalizedSubject || undefined,
    topic: normalizedTopic || undefined,
    goal: normalizedGoal || undefined,
  };
};

const DOMAIN_RUBRICS: Record<string, string[]> = {
  math: [
    'Checks definitions and assumptions before applying formulas.',
    'Explains why each transformation or inference is valid.',
    'Connects symbolic steps to the underlying concept or theorem.',
    'Identifies edge cases, constraints, and units where relevant.',
    'Uses examples or counterexamples to test understanding.',
  ],
  physics: [
    'Names the physical principle or conservation law being used.',
    'Explains causal relationships rather than only quoting equations.',
    'Tracks variables, units, assumptions, and idealizations.',
    'Relates mathematical form to physical intuition.',
    'Distinguishes definitions, laws, models, and empirical observations.',
  ],
};

export const getDomainRubric = (subject?: string): string[] => {
  const normalized = subject?.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return DOMAIN_RUBRICS[normalized] || [];
};
