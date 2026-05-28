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
