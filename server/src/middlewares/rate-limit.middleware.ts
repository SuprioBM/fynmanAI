import { NextFunction, Request, Response } from 'express';
import { redisClient } from '#src/config/redis-client.ts';
import { env } from '#config/env.ts';
import { sendApiError } from '#src/utils/api-response.ts';

type RateLimitConfig = {
  name: string;
  windowMs: number;
  max: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();

const positiveInt = (value: number | undefined, fallback: number): number =>
  value !== undefined && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;

const defaultRestKey = (req: Request): string => {
  const authHeader = req.headers.authorization;
  const tokenHint =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7, 23)
      : undefined;
  return tokenHint || req.ip || req.socket.remoteAddress || 'unknown';
};

const bucketKey = (config: RateLimitConfig, identity: string): string =>
  `${config.keyPrefix || 'rate-limit'}:${config.name}:${identity}`;

const applyMemoryRateLimit = (
  key: string,
  config: RateLimitConfig,
  now = Date.now()
): RateLimitResult => {
  const current = memoryBuckets.get(key);
  const resetAt =
    current && current.resetAt > now ? current.resetAt : now + config.windowMs;
  const count = current && current.resetAt > now ? current.count + 1 : 1;

  memoryBuckets.set(key, { count, resetAt });

  if (memoryBuckets.size > 10_000) {
    for (const [candidateKey, bucket] of memoryBuckets.entries()) {
      if (bucket.resetAt <= now) {
        memoryBuckets.delete(candidateKey);
      }
    }
  }

  return {
    allowed: count <= config.max,
    limit: config.max,
    remaining: Math.max(0, config.max - count),
    resetAt,
  };
};

export const applyRateLimit = async (
  identity: string,
  config: RateLimitConfig
): Promise<RateLimitResult> => {
  const now = Date.now();
  const key = bucketKey(config, identity);

  if (!redisClient.isOpen) {
    return applyMemoryRateLimit(key, config, now);
  }

  try {
    const count = Number(await redisClient.incr(key));
    if (count === 1) {
      await redisClient.pExpire(key, config.windowMs);
    }

    const ttl = Number(await redisClient.pTTL(key));
    const resetAt = now + (ttl > 0 ? ttl : config.windowMs);

    return {
      allowed: count <= config.max,
      limit: config.max,
      remaining: Math.max(0, config.max - count),
      resetAt,
    };
  } catch {
    return applyMemoryRateLimit(key, config, now);
  }
};

export const createRateLimitMiddleware =
  (config: RateLimitConfig) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await applyRateLimit(
      config.keyGenerator?.(req) || defaultRestKey(req),
      config
    );

    res.setHeader('RateLimit-Limit', String(result.limit));
    res.setHeader('RateLimit-Remaining', String(result.remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.resetAt - Date.now()) / 1000)
      );
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return sendApiError(res, {
        status: 429,
        message: 'Rate limit exceeded',
      });
    }

    next();
  };

export const rateLimitPresets = {
  api: {
    name: 'rest-api',
    windowMs: positiveInt(env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: positiveInt(env.RATE_LIMIT_MAX_REQUESTS, 300),
  },
  auth: {
    name: 'auth',
    windowMs: positiveInt(env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60_000),
    max: positiveInt(env.AUTH_RATE_LIMIT_MAX_REQUESTS, 30),
  },
  upload: {
    name: 'upload',
    windowMs: positiveInt(env.UPLOAD_RATE_LIMIT_WINDOW_MS, 60_000),
    max: positiveInt(env.UPLOAD_RATE_LIMIT_MAX_REQUESTS, 20),
  },
  websocket: {
    name: 'websocket-session',
    windowMs: positiveInt(env.WS_RATE_LIMIT_WINDOW_MS, 60_000),
    max: positiveInt(env.WS_RATE_LIMIT_MAX_EVENTS, 120),
  },
  audio: {
    name: 'websocket-audio',
    windowMs: positiveInt(env.WS_AUDIO_RATE_LIMIT_WINDOW_MS, 60_000),
    max: positiveInt(
      env.WS_AUDIO_RATE_LIMIT_MAX_CHUNKS,
      positiveInt(env.AUDIO_CHUNKS_PER_MINUTE, 60)
    ),
  },
} satisfies Record<string, RateLimitConfig>;
