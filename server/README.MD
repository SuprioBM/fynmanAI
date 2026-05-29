# Feynman AI Server

Backend service for the Feynman AI learning-by-teaching platform. It handles
real-time audio sessions over WebSockets, speech-to-text, retrieval, and
evaluation prompts that generate probing questions.

## Quick start

```bash
npm install
npm run dev
```

## Common scripts

- `npm run dev`
- `npm run worker:dev`
- `npm run dev:all`
- `npm run build`
- `npm run start`
- `npm run test`

## MVP Demo API Contract

Use `TEXT` resources as the canonical demo ingestion path. This keeps the demo
away from upload/storage timing and makes resource readiness synchronous.

### Required demo env

```bash
ENABLE_AUDIO_PROCESSING_QUEUE=false
ENABLE_REALTIME_FEEDBACK=true
ENABLE_FINAL_EVALUATION=true
LLM_ANALYSIS_INTERVAL=30
DATABASE_URL=...
JWT_SECRET=...
REFRESH_JWT_SECRET=...
OPENROUTER_API_KEY=... # or OPEN_ROUTER_APIKEY / OPENAI_API_KEY
EMBEDDING_PROVIDER=...
EMBEDDING_MODEL=...
QDRANT_URL=...
QDRANT_API_KEY=...
```

### 1. Create a ready resource

`POST /api/resources`

```json
{
  "title": "Photosynthesis notes",
  "sourceType": "TEXT",
  "text": "Photosynthesis converts light energy into chemical energy...",
  "subject": "biology",
  "topic": "photosynthesis"
}
```

The response returns `data.resource.status: "READY"`, populated chunks, and
`data.ingest.chunkCount`.

### 2. Start a session

`POST /api/sessions`

```json
{
  "subject": "biology",
  "topic": "photosynthesis",
  "goal": "Explain photosynthesis clearly",
  "resourceIds": ["RESOURCE_ID"]
}
```

The response returns `data.session.id`. The same payload can be sent over the
socket event `session:start`.

### 3. Send transcript or audio

Text fallback for smoke testing:

`POST /api/sessions/:sessionId/transcript`

```json
{
  "text": "Photosynthesis uses chlorophyll to capture light energy...",
  "startTimeMs": 0,
  "endTimeMs": 5000
}
```

Live demo audio socket event: `audio:chunk` or `audio_chunk`

```json
{
  "sessionId": "SESSION_ID",
  "audioBase64": "BASE64_WEBM_CHUNK",
  "mimeType": "audio/webm",
  "sequence": 1,
  "startTimeMs": 0,
  "endTimeMs": 5000
}
```

With `ENABLE_AUDIO_PROCESSING_QUEUE=false`, the server processes inline and
emits `transcript:chunk` plus the legacy alias `transcript_update`.

### 4. Get probing questions

`POST /api/sessions/:sessionId/feedback`

Socket audio processing also emits `analysis:question` plus the legacy alias
`probing_question` when the analysis interval is reached.

Frontend-safe shape:

```json
{
  "questions": ["What evidence supports that step?"],
  "clarifications": [],
  "detected_gaps": [],
  "topic_drift": false,
  "citations": []
}
```

### 5. End session and fetch report

`POST /api/sessions/:sessionId/end`

`GET /api/sessions/:sessionId/report`

Final evaluation shape:

```json
{
  "summary": "Short mastery summary.",
  "strengths": [],
  "weaknesses": [],
  "missed_concepts": [],
  "follow_up": [],
  "confidence_score": 50,
  "topic_drift": false,
  "cited_evidence": []
}
```
