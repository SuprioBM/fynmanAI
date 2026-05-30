FROM oven/bun:latest AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

ARG BACKEND_URL=http://localhost:8000
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_WS_URL=http://localhost:8000
ARG NEXT_PUBLIC_WS_PATH=/ws
ARG SESSION_SECRET_KEY=docker-session-secret

ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_WS_PATH=${NEXT_PUBLIC_WS_PATH}
ENV SESSION_SECRET_KEY=${SESSION_SECRET_KEY}

FROM base AS deps

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --no-cache --backend=copyfile

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_WS_URL=http://localhost:8000
ENV NEXT_PUBLIC_WS_PATH=/ws
ENV SESSION_SECRET_KEY=change-me-session-secret

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "x", "next", "start", "-H", "0.0.0.0", "-p", "3000"]