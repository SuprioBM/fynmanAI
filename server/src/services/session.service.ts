import prisma from '#src/config/database.ts';
import { appendTranscriptCache } from '#src/services/transcript-cache.service.ts';
import { attachResourceToSession } from '#src/services/resource.service.ts';
import {
  appendSessionEvent,
  setSessionMetadata,
} from '#src/services/session-cache.service.ts';
import { normalizeDomainScope } from '#src/services/domain.service.ts';
import { trackAnalyticsEvent } from '#src/services/analytics.service.ts';

type SessionStatus = 'ACTIVE' | 'ENDED';

export const createSession = async (params: {
  userId: string;
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
}) => {
  const scope = normalizeDomainScope({
    subject: params.subject,
    topic: params.topic,
    goal: params.goal,
  });

  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      subject: scope.subject,
      topic: scope.topic,
      goal: scope.goal,
    },
  });

  if (params.resourceIds?.length) {
    const owned = await prisma.resource.findMany({
      where: { id: { in: params.resourceIds }, userId: params.userId },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map(r => r.id));
    const unauthorized = params.resourceIds.filter(id => !ownedSet.has(id));
    if (unauthorized.length) {
      throw new Error(
        `Resources not found or not accessible: ${unauthorized.join(', ')}`
      );
    }
    await attachResourceToSession(session.id, params.resourceIds);
  }

  await setSessionMetadata(session.id, {
    userId: params.userId,
    subject: scope.subject,
    topic: scope.topic,
    goal: scope.goal,
    resourceIds: params.resourceIds,
    createdAt: new Date().toISOString(),
  });

  await appendSessionEvent(session.id, {
    type: 'session.created',
    timestamp: new Date().toISOString(),
    payload: {
      subject: scope.subject,
      topic: scope.topic,
      goal: scope.goal,
      resourceIds: params.resourceIds,
    },
  });

  await trackAnalyticsEvent({
    event: 'session.created',
    userId: params.userId,
    sessionId: session.id,
    payload: {
      subject: scope.subject,
      topic: scope.topic,
      goal: scope.goal,
    },
  });

  return session;
};

export const endSession = async (sessionId: string) => {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: 'ENDED' as SessionStatus,
      endedAt: new Date(),
    },
  });

  await trackAnalyticsEvent({
    event: 'session.ended',
    userId: session.userId,
    sessionId,
    payload: { endedAt: session.endedAt?.toISOString() },
  });

  return session;
};

export const getSessionById = async (sessionId: string) =>
  prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      resources: true,
    },
  });

export const appendTranscriptChunk = async (params: {
  sessionId: string;
  text: string;
  startTimeMs?: number;
  endTimeMs?: number;
}) => {
  const count = await prisma.transcriptChunk.count({
    where: { sessionId: params.sessionId },
  });

  const chunk = await prisma.transcriptChunk.create({
    data: {
      sessionId: params.sessionId,
      sequence: count + 1,
      text: params.text,
      startTimeMs: params.startTimeMs,
      endTimeMs: params.endTimeMs,
    },
  });

  await appendTranscriptCache(params.sessionId, {
    text: params.text,
    startTimeMs: params.startTimeMs,
    endTimeMs: params.endTimeMs,
  });

  await appendSessionEvent(params.sessionId, {
    type: 'transcript.appended',
    timestamp: new Date().toISOString(),
    payload: {
      startTimeMs: params.startTimeMs,
      endTimeMs: params.endTimeMs,
      length: params.text.length,
    },
  });

  return chunk;
};

export const getSessionTranscriptText = async (
  sessionId: string
): Promise<string> => {
  const chunks = await prisma.transcriptChunk.findMany({
    where: { sessionId },
    orderBy: { sequence: 'asc' },
  });

  return chunks.map(chunk => chunk.text).join('\n');
};
