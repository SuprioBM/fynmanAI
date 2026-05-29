# Feynman AI Server MVP Task Plan

This plan is based on `server/CONTEXT.MD`. The MVP server should prove the core product loop:

```text
upload learning resource
-> parse/chunk/embed content
-> start speaking session
-> transcribe user explanation
-> retrieve relevant resource context
-> ask probing questions
-> generate final understanding report
```

The server must stay focused on understanding evaluation, not generic tutoring or open-ended chat.

## MVP Must-Have Features

### 1. Session Management

**Goal:** Track one constrained learning/evaluation session from resource upload to final report.

**Required endpoints:**

- `POST /sessions/create`
- `POST /sessions/:id/end`
- `GET /sessions/:id/report`

**Required data:**

- session id
- user id, or temporary anonymous owner id for MVP
- subject
- topic
- learning goal
- started timestamp
- ended timestamp
- session status

**How to solve:**

- Create a `sessions` table/model.
- Restrict MVP subjects to one domain, preferably `physics` or `mathematics`.
- Validate that every upload, transcript, embedding, and evaluation belongs to a session.
- Keep the first implementation simple: one active speaking session per session id.

### 2. Resource Upload and Processing

**Goal:** Let users upload learning materials and turn them into searchable knowledge chunks.

**Required endpoint:**

- `POST /upload`

**Required behavior:**

- Accept PDF, text, notes, and optionally images.
- Validate file type and file size.
- Extract text from uploaded files.
- Clean extracted text.
- Chunk text into roughly `300-800` tokens.
- Use `10-20%` overlap between chunks.
- Store raw extracted text.
- Generate embeddings for each chunk.
- Store chunks and embeddings by session id.

**How to solve:**

- Use `multer` or an equivalent upload middleware.
- Start with text and PDF support first.
- Add OCR only if image uploads are required for the hackathon demo.
- For PDF parsing, use a reliable parser or the recommended tools from context if already available.
- Use OpenAI `text-embedding-3-small` or a local sentence-transformer.
- Store vector records with metadata:
  - `sessionId`
  - `resourceId`
  - `chunkIndex`
  - `text`
  - `topic`

### 3. Vector Retrieval

**Goal:** Ground all probing and evaluation in the uploaded resources.

**Required behavior:**

- Embed the recent transcript or topic query.
- Search only chunks belonging to the current session.
- Return top relevant text chunks.
- Pass actual text chunks to the LLM, never raw embeddings.

**How to solve:**

- Use Qdrant or Chroma for MVP.
- Create a retrieval service with one method like:

```ts
retrieveRelevantChunks(sessionId, queryText, limit)
```

- Default `limit` can be `4-8` chunks.
- Add a score threshold later if irrelevant chunks become noisy.

### 4. WebSocket Server

**Goal:** Support real-time audio streaming, transcript updates, probing questions, and session summaries.

**Required client -> server events:**

- `session_start`
- `audio_chunk`
- `session_end`

**Required server -> client events:**

- `transcript_update`
- `probing_question`
- `session_summary`
- `error`

**How to solve:**

- Use the `ws` library with Express.
- Validate the session id when a socket connects or when `session_start` is received.
- Keep per-session state:
  - current transcript buffer
  - last LLM analysis time
  - audio chunk count
  - connection status
- Do not call the LLM for every audio chunk.

### 5. Speech-to-Text Pipeline

**Goal:** Convert streamed speech into rolling transcript text.

**Required behavior:**

- Receive audio chunks every `2-5` seconds.
- Send each chunk, or buffered chunks, to STT.
- Append transcript to session memory.
- Emit `transcript_update` to the frontend.

**How to solve:**

- For fastest MVP, use Whisper API or another hosted STT provider.
- If local performance is available, use Faster-Whisper.
- Normalize transcript before storage:
  - trim whitespace
  - remove empty segments
  - store timestamp
  - associate with session id

### 6. Rolling Analysis and Probing Questions

**Goal:** Periodically evaluate the user's explanation and ask targeted follow-up questions.

**Required behavior:**

- Every `20-30` seconds:
  - collect recent transcript
  - retrieve relevant resource chunks
  - call the LLM with strict probing instructions
  - emit one short probing question

**LLM must do:**

- ask probing questions
- request clarification
- identify missing concepts
- stay inside the selected topic and uploaded materials

**LLM must not do:**

- give full explanations
- become a generic chatbot
- change topics
- answer as a normal tutor

**How to solve:**

- Build a dedicated `generateProbingQuestion` service.
- Use a strict system prompt that says the assistant is an examiner, not a tutor.
- Keep output short.
- Use structured output if possible:

```json
{
  "type": "probing_question",
  "question": "..."
}
```

### 7. Final Evaluation Report

**Goal:** Produce the final mastery evaluation when the session ends.

**Required behavior:**

- Assemble the full transcript.
- Retrieve the most relevant resource chunks.
- Generate:
  - understanding summary
  - weak areas
  - missed concepts
  - follow-up recommendations
  - conceptual confidence score

**How to solve:**

- Build a dedicated `generateFinalEvaluation` service.
- Store the result in an `evaluations` table/model.
- Return the same report from:
  - `session_summary` WebSocket event
  - `GET /sessions/:id/report`

### 8. Minimal Persistence

**Goal:** Store enough data to recover reports and keep session state isolated.

**Required models/tables:**

- `users`, optional for MVP if anonymous sessions are allowed
- `sessions`
- `resources`
- `transcript_chunks`
- `evaluations`

**Vector storage should contain:**

- chunk id
- session id
- resource id
- embedding
- chunk text
- metadata

**How to solve:**

- Use the existing server database setup if one already exists.
- If no database exists yet, pick one simple path:
  - PostgreSQL for durable MVP
  - SQLite for very fast local hackathon MVP
- Use Redis only if real-time session memory needs to survive process restarts or scale beyond one server.

### 9. Basic Security and Reliability

**Goal:** Avoid obvious abuse and data leaks.

**Required behavior:**

- Validate upload type and size.
- Sanitize extracted text before storage/use.
- Isolate resources and transcripts by session/user.
- Keep API keys server-side only.
- Rate-limit REST endpoints.
- Rate-limit or cap WebSocket sessions.
- Return clear server errors through the `error` WebSocket event.

**How to solve:**

- Add upload size limits.
- Add session ownership checks.
- Add defensive try/catch around STT, embedding, vector DB, and LLM calls.
- Log enough to debug session failures without logging secrets.

## Recommended Build Order

### Phase 1: Foundation

- [ ] Create session model and REST endpoints.
- [ ] Add upload endpoint.
- [ ] Parse text/PDF uploads.
- [ ] Chunk uploaded text.
- [ ] Store resources and chunks.

### Phase 2: Embeddings and Retrieval

- [ ] Generate embeddings for chunks.
- [ ] Store embeddings in vector DB.
- [ ] Implement session-scoped retrieval.
- [ ] Test retrieval with a sample topic query.

### Phase 3: Real-Time Session

- [ ] Add WebSocket server.
- [ ] Implement `session_start`.
- [ ] Implement `audio_chunk`.
- [ ] Connect audio chunks to STT.
- [ ] Emit `transcript_update`.

### Phase 4: Probing Questions

- [ ] Track rolling transcript memory.
- [ ] Trigger analysis every `20-30` seconds.
- [ ] Retrieve relevant resource chunks.
- [ ] Generate constrained LLM probing question.
- [ ] Emit `probing_question`.

### Phase 5: Final Report

- [ ] Implement `session_end`.
- [ ] Assemble full transcript.
- [ ] Generate final evaluation.
- [ ] Store evaluation.
- [ ] Emit `session_summary`.
- [ ] Serve report through `GET /sessions/:id/report`.

## MVP Acceptance Criteria

The server MVP is complete when:

- A user can create a session.
- A user can upload at least one learning resource.
- The server extracts, chunks, embeds, and stores the resource.
- The frontend can stream audio over WebSocket.
- The server transcribes audio and returns transcript updates.
- The server asks periodic probing questions grounded in uploaded material.
- The server does not answer like a generic chatbot.
- Ending the session creates a final evaluation report.
- The report includes weak areas, missed concepts, recommendations, and a confidence score.

## Explicit Non-Goals for MVP

- No general-purpose AI assistant.
- No support for every academic subject.
- No avatars.
- No social features.
- No complex analytics dashboard.
- No multi-agent architecture.
- No microservice split unless the single server becomes impossible to manage.

## Practical MVP Shortcut

For a hackathon version, prefer this simplified stack:

- Express REST API
- `ws` WebSocket server
- Hosted Whisper/STT API
- OpenAI embeddings
- Qdrant or Chroma vector DB
- PostgreSQL or SQLite for app data
- Strict LLM prompts with retrieval-grounded context

This keeps the project focused on the actual differentiator: evaluating understanding through constrained, resource-grounded probing.
