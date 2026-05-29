-- Align existing databases with the current Prisma schema.

ALTER TABLE "resources"
ADD COLUMN IF NOT EXISTS "file_path" TEXT,
ADD COLUMN IF NOT EXISTS "parsed_text" TEXT;

ALTER TABLE "evaluations"
ADD COLUMN IF NOT EXISTS "summary" TEXT,
ADD COLUMN IF NOT EXISTS "strengths" JSONB,
ADD COLUMN IF NOT EXISTS "weaknesses" JSONB,
ADD COLUMN IF NOT EXISTS "missed_concepts" JSONB,
ADD COLUMN IF NOT EXISTS "follow_up" JSONB,
ADD COLUMN IF NOT EXISTS "confidence_score" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "topic_drift" BOOLEAN;

CREATE TABLE IF NOT EXISTS "embeddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID,
    "resource_id" UUID,
    "resource_chunk_id" UUID,
    "vector" JSONB NOT NULL,
    "model" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "session_id" UUID,
    "event" VARCHAR(150) NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "embeddings_session_id_idx" ON "embeddings"("session_id");
CREATE INDEX IF NOT EXISTS "embeddings_resource_id_idx" ON "embeddings"("resource_id");
CREATE INDEX IF NOT EXISTS "embeddings_resource_chunk_id_idx" ON "embeddings"("resource_chunk_id");

CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events"("user_id");
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_idx" ON "analytics_events"("session_id");
CREATE INDEX IF NOT EXISTS "analytics_events_event_idx" ON "analytics_events"("event");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'embeddings_session_id_fkey'
  ) THEN
    ALTER TABLE "embeddings"
    ADD CONSTRAINT "embeddings_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'embeddings_resource_id_fkey'
  ) THEN
    ALTER TABLE "embeddings"
    ADD CONSTRAINT "embeddings_resource_id_fkey"
    FOREIGN KEY ("resource_id") REFERENCES "resources"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'embeddings_resource_chunk_id_fkey'
  ) THEN
    ALTER TABLE "embeddings"
    ADD CONSTRAINT "embeddings_resource_chunk_id_fkey"
    FOREIGN KEY ("resource_chunk_id") REFERENCES "resource_chunks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_user_id_fkey'
  ) THEN
    ALTER TABLE "analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_session_id_fkey'
  ) THEN
    ALTER TABLE "analytics_events"
    ADD CONSTRAINT "analytics_events_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
