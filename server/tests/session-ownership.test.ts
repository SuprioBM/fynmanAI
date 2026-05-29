import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// --- Mocks ----------------------------------------------------------------

const mockPrismaSessionCreate = jest.fn<any>();
const mockPrismaSessionUpdate = jest.fn<any>();
const mockPrismaSessionFindUnique = jest.fn<any>();
const mockPrismaResourceFindMany = jest.fn<any>();
const mockPrismaTranscriptChunkCount = jest.fn<any>();
const mockPrismaTranscriptChunkCreate = jest.fn<any>();
const mockPrismaTranscriptChunkFindMany = jest.fn<any>();
const mockPrismaSessionResourceCreateMany = jest.fn<any>();

jest.unstable_mockModule('#src/config/database.ts', () => ({
  default: {
    session: {
      create: mockPrismaSessionCreate,
      update: mockPrismaSessionUpdate,
      findUnique: mockPrismaSessionFindUnique,
    },
    resource: {
      findMany: mockPrismaResourceFindMany,
    },
    transcriptChunk: {
      count: mockPrismaTranscriptChunkCount,
      create: mockPrismaTranscriptChunkCreate,
      findMany: mockPrismaTranscriptChunkFindMany,
    },
    sessionResource: {
      createMany: mockPrismaSessionResourceCreateMany,
    },
  },
}));

const mockNormalizeDomainScope = jest.fn<any>();
jest.unstable_mockModule('#src/services/domain.service.ts', () => ({
  normalizeDomainScope: mockNormalizeDomainScope,
}));

const mockSetSessionMetadata = jest.fn<any>();
const mockAppendSessionEvent = jest.fn<any>();
jest.unstable_mockModule('#src/services/session-cache.service.ts', () => ({
  setSessionMetadata: mockSetSessionMetadata,
  appendSessionEvent: mockAppendSessionEvent,
}));

const mockAppendTranscriptCache = jest.fn<any>();
jest.unstable_mockModule('#src/services/transcript-cache.service.ts', () => ({
  appendTranscriptCache: mockAppendTranscriptCache,
  getTranscriptWindowText: jest.fn(),
  shouldRunAnalysis: jest.fn(),
}));

const mockTrackAnalyticsEvent = jest.fn<any>();
jest.unstable_mockModule('#src/services/analytics.service.ts', () => ({
  trackAnalyticsEvent: mockTrackAnalyticsEvent,
}));

jest.unstable_mockModule('#src/services/resource.service.ts', () => ({
  attachResourceToSession: jest.fn<any>().mockResolvedValue(undefined),
  createResource: jest.fn(),
  updateResourceStatus: jest.fn(),
  getResourceById: jest.fn(),
  updateResourceFields: jest.fn(),
  createResourceChunk: jest.fn(),
  createEmbeddingRecord: jest.fn(),
}));

// --- Tests ----------------------------------------------------------------

const { createSession } = await import('#src/services/session.service.ts');

describe('createSession – resource ownership validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomainScope.mockImplementation((scope: any) => scope);
    mockSetSessionMetadata.mockResolvedValue(undefined);
    mockAppendSessionEvent.mockResolvedValue(undefined);
    mockTrackAnalyticsEvent.mockResolvedValue(undefined);
    mockPrismaSessionCreate.mockResolvedValue({
      id: 'sess-1',
      userId: 'user-1',
      subject: 'physics',
      topic: 'Newton',
      goal: null,
      resources: [],
    });
  });

  it('creates session without resources', async () => {
    const result = await createSession({ userId: 'user-1' });
    expect(result).toBeTruthy();
    expect(mockPrismaResourceFindMany).not.toHaveBeenCalled();
  });

  it('creates session when all resourceIds are owned by the user', async () => {
    mockPrismaResourceFindMany.mockResolvedValue([
      {
        id: 'res-1',
        userId: 'user-1',
        status: 'READY',
        subject: null,
        topic: null,
      },
      {
        id: 'res-2',
        userId: 'user-1',
        status: 'READY',
        subject: null,
        topic: null,
      },
    ]);

    const result = await createSession({
      userId: 'user-1',
      resourceIds: ['res-1', 'res-2'],
    });

    expect(result).toBeTruthy();
    expect(mockPrismaResourceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['res-1', 'res-2'] },
        }),
      })
    );
  });

  it('throws when a resourceId does not belong to the user', async () => {
    // res-1 belongs to another user
    mockPrismaResourceFindMany.mockResolvedValue([
      {
        id: 'res-1',
        userId: 'other-user',
        status: 'READY',
        subject: null,
        topic: null,
      },
    ]);

    await expect(
      createSession({
        userId: 'user-1',
        resourceIds: ['res-1', 'res-stolen'],
      })
    ).rejects.toThrow(/Invalid session resources/i);

    expect(mockPrismaSessionCreate).not.toHaveBeenCalled();
  });

  it('throws when none of the resourceIds are owned by the user', async () => {
    mockPrismaResourceFindMany.mockResolvedValue([]);

    await expect(
      createSession({
        userId: 'user-1',
        resourceIds: ['other-user-res'],
      })
    ).rejects.toThrow(/Invalid session resources/i);
  });
});

describe('getSessionById', () => {
  it('returns session with resources when found', async () => {
    const session = {
      id: 'sess-1',
      userId: 'user-1',
      resources: [{ resourceId: 'res-1' }],
    };
    mockPrismaSessionFindUnique.mockResolvedValue(session);

    const { getSessionById } = await import('#src/services/session.service.ts');
    const result = await getSessionById('sess-1');
    expect(result).toEqual(session);
  });

  it('returns null for non-existent session', async () => {
    mockPrismaSessionFindUnique.mockResolvedValue(null);

    const { getSessionById } = await import('#src/services/session.service.ts');
    const result = await getSessionById('ghost-sess');
    expect(result).toBeNull();
  });
});
