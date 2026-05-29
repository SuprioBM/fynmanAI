import redis from 'redis';
import prisma from '#src/config/database.ts';
import { env } from '#src/config/env.ts';
import { documentParserService } from '#src/services/document-parser.service.ts';
import { checkQdrantHealth } from '#src/services/qdrant.service.ts';

type ComponentStatus = 'ok' | 'degraded' | 'down';

type HealthComponent = {
  status: ComponentStatus;
  latencyMs?: number;
  details?: Record<string, unknown>;
  error?: string;
};

const withTiming = async (
  runner: () => Promise<Record<string, unknown> | void>,
  timeoutMs = 5_000
): Promise<HealthComponent> => {
  const startedAt = Date.now();

  try {
    const details = await Promise.race([
      runner(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Health check timed out')),
          timeoutMs
        );
      }),
    ]);

    return {
      status: 'ok',
      latencyMs: Date.now() - startedAt,
      details: details || undefined,
    };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const checkDatabase = () =>
  withTiming(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

const checkRedis = () =>
  withTiming(async () => {
    const client = redis.createClient({
      username: 'default',
      password: env.REDIS_PASSWORD,
      socket: {
        host: env.REDIS_HOST || '127.0.0.1',
        port: Number(env.REDIS_PORT || 6379),
      },
      database: env.REDIS_DB,
    });

    try {
      await client.connect();
      const pong = await client.ping();
      return { ping: pong };
    } finally {
      if (client.isOpen) {
        await client.quit();
      }
    }
  });

const checkQdrant = () =>
  withTiming(async () => {
    const health = await checkQdrantHealth();
    return health;
  });

const checkQueues = () =>
  withTiming(async () => {
    const [{ urlIngestQueue }, { audioProcessingQueue }] = await Promise.all([
      import('#src/queues/url-ingest.queue.ts'),
      import('#src/queues/audio-processing.queue.ts'),
    ]);
    const [urlIngest, audioProcessing] = await Promise.all([
      urlIngestQueue.getCounts(),
      audioProcessingQueue.getCounts(),
    ]);

    return {
      urlIngest,
      audioProcessing,
    };
  });

const checkParser = () =>
  withTiming(async () => {
    const health = await documentParserService.checkHealth();
    if (!health.available) {
      throw new Error(health.details || 'Document parser unavailable');
    }

    return health as unknown as Record<string, unknown>;
  }, 10_000);

const checkStt = async (): Promise<HealthComponent> => {
  const hasKey = Boolean(env.WHISPER_API_KEY || env.OPENAI_API_KEY);
  return {
    status: hasKey ? 'ok' : 'down',
    details: {
      provider: env.STT_PROVIDER || 'openai-whisper',
      model: env.STT_MODEL || 'whisper-1',
      configured: hasKey,
    },
    error: hasKey ? undefined : 'WHISPER_API_KEY or OPENAI_API_KEY is missing',
  };
};

const checkLlm = async (): Promise<HealthComponent> => {
  const provider = env.LLM_PROVIDER || 'openrouter';
  const hasProviderKey =
    provider === 'groq'
      ? Boolean(env.GROQ_API_KEY)
      : provider === 'openai'
        ? Boolean(env.OPENAI_API_KEY)
        : Boolean(
            env.OPENROUTER_API_KEY ||
            env.OPEN_ROUTER_APIKEY ||
            env.OPENAI_API_KEY
          );
  const hasChatModel = Boolean(
    env.LLM_MODEL || env.REALTIME_MODEL || env.FINAL_EVALUATION_MODEL
  );
  const embeddingProvider = env.EMBEDDING_PROVIDER || 'openrouter';
  const hasEmbeddingModel = Boolean(env.EMBEDDING_MODEL);

  const configured = hasProviderKey && hasChatModel && hasEmbeddingModel;

  return {
    status: configured ? 'ok' : 'down',
    details: {
      provider,
      chatModelConfigured: hasChatModel,
      embeddingProvider,
      embeddingModelConfigured: hasEmbeddingModel,
    },
    error: configured
      ? undefined
      : 'LLM provider key, chat model, or embedding model is missing',
  };
};

const summarize = (components: Record<string, HealthComponent>) => {
  const statuses = Object.values(components).map(component => component.status);
  if (statuses.every(status => status === 'ok')) {
    return 'ok';
  }

  if (statuses.some(status => status === 'ok')) {
    return 'degraded';
  }

  return 'down';
};

export const getSystemHealth = async () => {
  const [database, redisHealth, qdrant, queues, stt, parser, llm] =
    await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkQdrant(),
      checkQueues(),
      checkStt(),
      checkParser(),
      checkLlm(),
    ]);

  const components = {
    database,
    redis: redisHealth,
    qdrant,
    queues,
    stt,
    parser,
    llm,
  };

  return {
    status: summarize(components),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    components,
  };
};
