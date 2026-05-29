import prisma from '#src/config/database.ts';
import { Prisma } from '#src/generated/client.ts';
import logger from '#config/logger.ts';
import { env } from '#config/env.ts';

type AnalyticsEventInput = {
  event: string;
  userId?: string;
  sessionId?: string;
  payload?: Record<string, unknown> | null;
};

export type TranscriptAnalytics = {
  speakingConfidence: number;
  hesitationRate: number;
  explanationDepth: number;
  conceptCoverage: number;
  semanticConsistency: number;
  topicDrift: boolean;
};

type DateRange = {
  from?: Date;
  to?: Date;
};

type AnalyticsMetadata = {
  analytics?: Partial<TranscriptAnalytics>;
  citations?: unknown[];
  citedEvidence?: unknown;
  rubric?: unknown;
};

const clampScore = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const countMatches = (text: string, pattern: RegExp): number =>
  text.match(pattern)?.length || 0;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asAnalyticsMetadata = (value: unknown): AnalyticsMetadata => {
  const record = asRecord(value);
  return {
    analytics: asRecord(record.analytics) as Partial<TranscriptAnalytics>,
    citations: Array.isArray(record.citations) ? record.citations : [],
    citedEvidence: record.citedEvidence,
    rubric: record.rubric,
  };
};

const coerceStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|\r|,|;/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const average = (values: number[]): number | null => {
  const finiteValues = values.filter(Number.isFinite);
  if (!finiteValues.length) {
    return null;
  }

  return Number(
    (
      finiteValues.reduce((total, value) => total + value, 0) /
      finiteValues.length
    ).toFixed(2)
  );
};

const getSessionDurationMs = (session: {
  startedAt: Date;
  endedAt?: Date | null;
  transcriptChunks?: { startTimeMs?: number | null; endTimeMs?: number | null }[];
}): number | null => {
  const timedChunks = session.transcriptChunks || [];
  const chunkDuration = timedChunks.reduce((max, chunk) => {
    if (
      typeof chunk.startTimeMs === 'number' &&
      typeof chunk.endTimeMs === 'number'
    ) {
      return Math.max(max, chunk.endTimeMs - chunk.startTimeMs);
    }

    return max;
  }, 0);

  if (chunkDuration > 0) {
    return chunkDuration;
  }

  if (session.endedAt) {
    return session.endedAt.getTime() - session.startedAt.getTime();
  }

  return null;
};

const buildDateWhere = (range: DateRange = {}) => ({
  ...(range.from ? { gte: range.from } : {}),
  ...(range.to ? { lte: range.to } : {}),
});

const hasDateRange = (range: DateRange = {}) => Boolean(range.from || range.to);

const getLatestFinalEvaluation = <T extends { type: string; createdAt: Date }>(
  evaluations: T[]
): T | undefined =>
  evaluations
    .filter(evaluation => evaluation.type === 'FINAL')
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())[0];

const countByValue = (values: (string | null | undefined)[]) => {
  const counts = new Map<string, number>();
  values
    .map(value => value?.trim())
    .filter(Boolean)
    .forEach(value => counts.set(value as string, (counts.get(value as string) || 0) + 1));

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((first, second) => second.count - first.count || first.value.localeCompare(second.value));
};

export const analyzeTranscriptQuality = (params: {
  transcript: string;
  context?: string[];
  subject?: string;
  topic?: string;
}): TranscriptAnalytics => {
  const normalized = params.transcript.toLowerCase();
  const words = normalized.match(/\b[\w'-]+\b/g) || [];
  const uniqueWords = new Set(words);
  const fillerCount = countMatches(
    normalized,
    /\b(um|uh|er|ah|like|basically|actually|you know|sort of|kind of)\b/g
  );
  const reasoningCount = countMatches(
    normalized,
    /\b(because|therefore|so|since|if|then|means|implies|causes|depends|example)\b/g
  );

  const scopeTerms = [params.subject, params.topic]
    .filter(Boolean)
    .flatMap(
      value =>
        String(value)
          .toLowerCase()
          .match(/\b[\w'-]+\b/g) || []
    )
    .filter(term => term.length > 2);
  const contextTerms = (params.context || [])
    .join(' ')
    .toLowerCase()
    .match(/\b[\w'-]+\b/g);
  const importantContextTerms = Array.from(new Set(contextTerms || []))
    .filter(term => term.length > 5)
    .slice(0, 80);
  const coveredContextTerms = importantContextTerms.filter(term =>
    uniqueWords.has(term)
  ).length;
  const coveredScopeTerms = scopeTerms.filter(term => uniqueWords.has(term));

  const hesitationPenalty = words.length
    ? Math.min(45, (fillerCount / words.length) * 500)
    : 35;
  const lexicalVariety = words.length
    ? (uniqueWords.size / words.length) * 100
    : 0;
  const reasoningDensity = words.length
    ? Math.min(100, (reasoningCount / words.length) * 900)
    : 0;
  const contextCoverage = importantContextTerms.length
    ? (coveredContextTerms / importantContextTerms.length) * 100
    : coveredScopeTerms.length
      ? 70
      : 0;
  const topicDrift =
    Boolean(scopeTerms.length) &&
    words.length >= 40 &&
    coveredScopeTerms.length === 0;

  return {
    speakingConfidence: clampScore(
      70 + lexicalVariety * 0.2 - hesitationPenalty
    ),
    hesitationRate: Number(
      (words.length ? fillerCount / words.length : 0).toFixed(4)
    ),
    explanationDepth: clampScore(reasoningDensity * 0.7 + lexicalVariety * 0.3),
    conceptCoverage: clampScore(contextCoverage),
    semanticConsistency: clampScore(
      topicDrift ? 35 : 70 + contextCoverage * 0.3
    ),
    topicDrift,
  };
};

export const trackAnalyticsEvent = async (
  input: AnalyticsEventInput
): Promise<void> => {
  if (!env.ENABLE_ANALYTICS) {
    return;
  }

  try {
    await prisma.analyticsEvent.create({
      data: {
        event: input.event,
        userId: input.userId,
        sessionId: input.sessionId,
        payload: input.payload as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    logger.warn('[Analytics] Failed to persist event', {
      event: input.event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getSessionAnalytics = async (params: {
  userId: string;
  sessionId: string;
}) => {
  const session = await prisma.session.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    include: {
      transcriptChunks: { orderBy: { sequence: 'asc' } },
      evaluations: { orderBy: { createdAt: 'asc' } },
      resources: {
        include: {
          resource: {
            select: {
              id: true,
              title: true,
              subject: true,
              topic: true,
              status: true,
            },
          },
        },
      },
      analyticsEvents: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) {
    return null;
  }

  const transcript = session.transcriptChunks.map(chunk => chunk.text).join('\n');
  const words = transcript.match(/\b[\w'-]+\b/g) || [];
  const latestFinal = getLatestFinalEvaluation(session.evaluations);
  const evaluationAnalytics = session.evaluations
    .map(evaluation => asAnalyticsMetadata(evaluation.metadata).analytics)
    .filter(Boolean);
  const finalMetadata = latestFinal
    ? asAnalyticsMetadata(latestFinal.metadata)
    : undefined;

  return {
    session: {
      id: session.id,
      subject: session.subject,
      topic: session.topic,
      goal: session.goal,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationMs: getSessionDurationMs(session),
    },
    transcript: {
      chunkCount: session.transcriptChunks.length,
      wordCount: words.length,
      characterCount: transcript.length,
    },
    resources: session.resources.map(item => item.resource),
    evaluations: {
      total: session.evaluations.length,
      rolling: session.evaluations.filter(item => item.type === 'ROLLING').length,
      final: session.evaluations.filter(item => item.type === 'FINAL').length,
      latestFinal: latestFinal
        ? {
            id: latestFinal.id,
            summary: latestFinal.summary,
            confidenceScore: latestFinal.confidenceScore,
            topicDrift: latestFinal.topicDrift,
            strengths: coerceStringArray(latestFinal.strengths),
            weaknesses: coerceStringArray(latestFinal.weaknesses),
            missedConcepts: coerceStringArray(latestFinal.missedConcepts),
            followUp: coerceStringArray(latestFinal.followUp),
            citations: finalMetadata?.citations || [],
            citedEvidence: coerceStringArray(finalMetadata?.citedEvidence),
            createdAt: latestFinal.createdAt,
          }
        : null,
    },
    quality: {
      speakingConfidence: average(
        evaluationAnalytics.map(item => Number(item.speakingConfidence))
      ),
      explanationDepth: average(
        evaluationAnalytics.map(item => Number(item.explanationDepth))
      ),
      conceptCoverage: average(
        evaluationAnalytics.map(item => Number(item.conceptCoverage))
      ),
      semanticConsistency: average(
        evaluationAnalytics.map(item => Number(item.semanticConsistency))
      ),
      hesitationRate: average(
        evaluationAnalytics.map(item => Number(item.hesitationRate))
      ),
      topicDriftEvents: session.evaluations.filter(
        evaluation => evaluation.topicDrift === true
      ).length,
    },
    events: {
      total: session.analyticsEvents.length,
      byType: countByValue(session.analyticsEvents.map(event => event.event)),
    },
  };
};

export const getUserProgress = async (params: {
  userId: string;
  range?: DateRange;
}) => {
  const sessions = await prisma.session.findMany({
    where: {
      userId: params.userId,
      ...(hasDateRange(params.range)
        ? { startedAt: buildDateWhere(params.range) }
        : {}),
    },
    orderBy: { startedAt: 'asc' },
    include: {
      transcriptChunks: true,
      evaluations: { orderBy: { createdAt: 'asc' } },
      _count: { select: { resources: true } },
    },
  });

  const finalEvaluations = sessions
    .map(session => ({ session, evaluation: getLatestFinalEvaluation(session.evaluations) }))
    .filter(item => item.evaluation);
  const confidenceScores = finalEvaluations
    .map(item => Number(item.evaluation?.confidenceScore))
    .filter(Number.isFinite);
  const durations = sessions
    .map(session => getSessionDurationMs(session))
    .filter((value): value is number => typeof value === 'number');

  return {
    totals: {
      sessions: sessions.length,
      activeSessions: sessions.filter(session => session.status === 'ACTIVE').length,
      endedSessions: sessions.filter(session => session.status === 'ENDED').length,
      finalEvaluations: finalEvaluations.length,
      transcriptChunks: sessions.reduce(
        (total, session) => total + session.transcriptChunks.length,
        0
      ),
      resourcesAttached: sessions.reduce(
        (total, session) => total + session._count.resources,
        0
      ),
    },
    averages: {
      confidenceScore: average(confidenceScores),
      sessionDurationMs: average(durations),
    },
    subjects: countByValue(sessions.map(session => session.subject)),
    topics: countByValue(sessions.map(session => session.topic)),
    missedConcepts: countByValue(
      finalEvaluations.flatMap(item =>
        coerceStringArray(item.evaluation?.missedConcepts)
      )
    ),
    trend: finalEvaluations.map(({ session, evaluation }) => ({
      sessionId: session.id,
      subject: session.subject,
      topic: session.topic,
      startedAt: session.startedAt,
      confidenceScore: evaluation?.confidenceScore ?? null,
      topicDrift: Boolean(evaluation?.topicDrift),
      missedConcepts: coerceStringArray(evaluation?.missedConcepts),
    })),
  };
};

export const getConceptCoverageAndTopicDriftTrends = async (params: {
  userId: string;
  range?: DateRange;
}) => {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      session: {
        userId: params.userId,
        ...(hasDateRange(params.range)
          ? { startedAt: buildDateWhere(params.range) }
          : {}),
      },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      session: {
        select: {
          id: true,
          subject: true,
          topic: true,
          startedAt: true,
        },
      },
    },
  });

  const points = evaluations.map(evaluation => {
    const metadata = asAnalyticsMetadata(evaluation.metadata);
    return {
      evaluationId: evaluation.id,
      sessionId: evaluation.sessionId,
      type: evaluation.type,
      subject: evaluation.session.subject,
      topic: evaluation.session.topic,
      createdAt: evaluation.createdAt,
      conceptCoverage:
        typeof metadata.analytics?.conceptCoverage === 'number'
          ? metadata.analytics.conceptCoverage
          : null,
      semanticConsistency:
        typeof metadata.analytics?.semanticConsistency === 'number'
          ? metadata.analytics.semanticConsistency
          : null,
      explanationDepth:
        typeof metadata.analytics?.explanationDepth === 'number'
          ? metadata.analytics.explanationDepth
          : null,
      topicDrift: Boolean(evaluation.topicDrift),
      missedConcepts: coerceStringArray(evaluation.missedConcepts),
    };
  });

  const topicKeys = Array.from(
    new Set(points.map(point => point.topic || 'Unspecified topic'))
  );

  return {
    trend: points,
    byTopic: topicKeys.map(topic => {
      const topicPoints = points.filter(
        point => (point.topic || 'Unspecified topic') === topic
      );
      return {
        topic,
        evaluations: topicPoints.length,
        averageConceptCoverage: average(
          topicPoints.map(point => Number(point.conceptCoverage))
        ),
        topicDriftRate: topicPoints.length
          ? Number(
              (
                topicPoints.filter(point => point.topicDrift).length /
                topicPoints.length
              ).toFixed(4)
            )
          : 0,
        missedConcepts: countByValue(
          topicPoints.flatMap(point => point.missedConcepts)
        ),
      };
    }),
  };
};

export const getFinalEvaluationExport = async (params: {
  userId: string;
  sessionId: string;
}) => {
  const session = await prisma.session.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    include: {
      transcriptChunks: { orderBy: { sequence: 'asc' } },
      resources: {
        include: {
          resource: {
            select: {
              id: true,
              title: true,
              sourceType: true,
              subject: true,
              topic: true,
              sourceUrl: true,
            },
          },
        },
      },
      evaluations: {
        where: { type: 'FINAL' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!session) {
    return null;
  }

  const evaluation = session.evaluations[0];
  if (!evaluation) {
    return { session, report: null };
  }

  const metadata = asAnalyticsMetadata(evaluation.metadata);
  return {
    session: {
      id: session.id,
      subject: session.subject,
      topic: session.topic,
      goal: session.goal,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationMs: getSessionDurationMs(session),
    },
    resources: session.resources.map(item => item.resource),
    transcript: session.transcriptChunks.map(chunk => ({
      sequence: chunk.sequence,
      text: chunk.text,
      startTimeMs: chunk.startTimeMs,
      endTimeMs: chunk.endTimeMs,
    })),
    report: {
      id: evaluation.id,
      summary: evaluation.summary,
      strengths: coerceStringArray(evaluation.strengths),
      weaknesses: coerceStringArray(evaluation.weaknesses),
      missedConcepts: coerceStringArray(evaluation.missedConcepts),
      followUp: coerceStringArray(evaluation.followUp),
      confidenceScore: evaluation.confidenceScore,
      topicDrift: evaluation.topicDrift,
      citations: metadata.citations || [],
      citedEvidence: coerceStringArray(metadata.citedEvidence),
      analytics: metadata.analytics || null,
      rubric: coerceStringArray(metadata.rubric),
      createdAt: evaluation.createdAt,
      rawContent: evaluation.content,
    },
  };
};

export const formatEvaluationExportMarkdown = (exportData: NonNullable<
  Awaited<ReturnType<typeof getFinalEvaluationExport>>
>): string => {
  if (!exportData.report) {
    return '# Feynman AI Evaluation Report\n\nFinal evaluation not available.\n';
  }

  const report = exportData.report;
  const session = exportData.session;
  const list = (items: string[]) =>
    items.length ? items.map(item => `- ${item}`).join('\n') : '- None recorded';

  return [
    '# Feynman AI Evaluation Report',
    '',
    `Session: ${session.id}`,
    `Subject: ${session.subject || 'Unspecified'}`,
    `Topic: ${session.topic || 'Unspecified'}`,
    `Status: ${session.status}`,
    `Confidence score: ${report.confidenceScore ?? 'n/a'}`,
    `Topic drift: ${report.topicDrift ? 'yes' : 'no'}`,
    '',
    '## Summary',
    report.summary || 'No summary recorded.',
    '',
    '## Strengths',
    list(report.strengths),
    '',
    '## Weaknesses',
    list(report.weaknesses),
    '',
    '## Missed Concepts',
    list(report.missedConcepts),
    '',
    '## Follow Up',
    list(report.followUp),
    '',
    '## Resources',
    list(exportData.resources.map(resource => resource.title)),
    '',
  ].join('\n');
};
