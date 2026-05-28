
**Legend**
- [x] Implemented
- [ ] Partial
- [ ] Missing
- [ ] N/A (frontend/product)

**Project Vision**
- [x] Implemented — listens to the user in real time
- [x] Implemented — transcribes speech continuously
- [x] Implemented — retrieves relevant knowledge from uploaded resources
- [x] Implemented — asks deep follow-up questions
- [ ] Partial — identifies weak understanding
- [ ] Partial — generates a final mastery evaluation
- [ ] Partial — evaluate understanding
- [x] Implemented — probe reasoning
- [ ] Partial — identify conceptual gaps
- [ ] Partial — force deeper explanations

**Core Philosophy**
- [ ] N/A (product principle) — fast answers
- [ ] N/A (product principle) — summaries
- [ ] N/A (product principle) — convenience
- [ ] N/A (product principle) — active recall
- [ ] N/A (product principle) — conceptual articulation
- [ ] N/A (product principle) — reasoning depth
- [ ] N/A (product principle) — teaching-based learning

**Primary MVP Goal**
- [x] Implemented — accepts uploaded learning resources
- [x] Implemented — processes and embeds them
- [x] Implemented — listens to user explanations in real time
- [x] Implemented — asks targeted follow-up questions
- [ ] Partial — evaluates understanding quality

**Scope Constraints**
- [ ] Missing — all subjects
- [ ] Missing — general-purpose tutoring
- [ ] Missing — open-ended chatting
- [ ] Missing — mathematics
- [ ] Missing — physics
- [ ] N/A (rationale) — easier benchmarking
- [ ] N/A (rationale) — clearer conceptual correctness
- [ ] N/A (rationale) — better evaluation structure
- [ ] N/A (rationale) — less hallucination risk

**System Design (User)**
- [ ] N/A (user action) — uploads resources
- [ ] N/A (user action) — selects topic
- [ ] N/A (user action) — explains verbally
- [ ] Partial — receives evaluation

**System Design (Frontend)**
- [ ] N/A (frontend) — audio capture
- [ ] N/A (frontend) — websocket streaming
- [ ] N/A (frontend) — live transcript display
- [ ] N/A (frontend) — feedback UI
- [ ] N/A (frontend) — session dashboard

**System Design (Backend)**
- [x] Implemented — websocket server
- [x] Implemented — session manager
- [x] Implemented — transcription pipeline
- [x] Implemented — embedding pipeline
- [x] Implemented — vector retrieval
- [x] Implemented — llm orchestrator
- [x] Implemented — evaluation engine
- [ ] Missing — analytics

**System Design (Infrastructure)**
- [x] Implemented — Redis
- [x] Implemented — Vector DB
- [ ] Partial — Object Storage
- [x] Implemented — LLM APIs

**Core Data Flow Step 1 — Resource Upload**
- [x] Implemented — PDF
- [x] Implemented — image
- [ ] Partial — notes
- [x] Implemented — text files
- [x] Implemented — detects file type
- [x] Implemented — extracts text
- [ ] Partial — cleans text
- [x] Implemented — chunks content
- [x] Implemented — generates embeddings
- [x] Implemented — stores embeddings in vector DB

**Core Data Flow Step 2 — Topic Initialization**
- [ ] Partial — subject
- [ ] Partial — topic
- [ ] Partial — learning goal
- [ ] Partial — the semantic anchor
- [ ] Partial — retrieval filter
- [ ] Partial — evaluation scope

**Core Data Flow Step 3 — Real-Time Speaking Session**
- [ ] N/A (frontend) — captures microphone audio
- [ ] N/A (frontend) — chunks audio every 2–5 seconds
- [ ] N/A (frontend) — streams chunks via WebSocket
- [ ] Partial — buffers audio
- [x] Implemented — runs speech-to-text continuously
- [x] Implemented — appends transcript to rolling memory

**Core Data Flow Step 4 — Rolling Analysis**
- [x] Implemented — recent transcript is normalized
- [x] Implemented — transcript is embedded
- [x] Implemented — vector search retrieves relevant chunks
- [x] Implemented — LLM receives recent transcript
- [x] Implemented — LLM receives retrieved context
- [ ] Partial — LLM receives evaluation instructions
- [x] Implemented — probing questions
- [ ] Partial — clarification requests
- [ ] Partial — gap detection

**Core Data Flow Step 5 — Final Evaluation**
- [ ] Partial — full transcript assembled
- [ ] Partial — understanding analysis generated
- [ ] Partial — conceptual gaps identified
- [ ] Missing — confidence score computed
- [ ] Partial — final report returned

**User Flow — Upload Phase**
- [x] Implemented — creates session
- [x] Implemented — uploads learning resources
- [ ] Partial — selects topic
- [x] Implemented — starts session

**User Flow — Learning Phase**
- [ ] N/A (user action) — explains concepts verbally
- [ ] N/A (user action) — continues speaking naturally
- [x] Implemented — receives periodic probing questions
- [ ] N/A (user action) — clarifies weak explanations

**User Flow — Evaluation Phase**
- [ ] Partial — understanding summary
- [ ] Partial — weak areas
- [ ] Partial — missed concepts
- [ ] Partial — follow-up recommendations
- [ ] Missing — conceptual confidence score

**Technical Architecture — Frontend Stack**
- [ ] N/A (frontend) — Next.js
- [ ] N/A (frontend) — React
- [ ] N/A (frontend) — Tailwind
- [ ] N/A (frontend) — WebSocket client

**Technical Architecture — Frontend Responsibilities**
- [ ] N/A (frontend) — microphone access
- [ ] N/A (frontend) — audio chunking
- [ ] N/A (frontend) — websocket communication
- [ ] N/A (frontend) — session UI
- [ ] N/A (frontend) — transcript display
- [ ] N/A (frontend) — question display
- [ ] N/A (frontend) — analytics display

**Technical Architecture — Backend Stack**
- [x] Implemented — Node.js
- [x] Implemented — Express
- [x] Implemented — ws (WebSocket library)

**Technical Architecture — Backend Responsibilities**
- [x] Implemented — session orchestration
- [x] Implemented — websocket handling
- [x] Implemented — authentication
- [x] Implemented — transcript processing
- [x] Implemented — LLM coordination
- [x] Implemented — vector retrieval
- [ ] Missing — analytics

**Why WebSockets**
- [ ] N/A (rationale) — continuous streaming
- [ ] N/A (rationale) — low latency
- [ ] N/A (rationale) — bidirectional communication
- [ ] N/A (rationale) — real-time feedback
- [ ] N/A (rationale) — interruption-free speaking

**Speech-to-Text Design — Reasons**
- [ ] N/A (rationale) — centralized pipeline
- [ ] N/A (rationale) — better models
- [ ] N/A (rationale) — stable behavior
- [ ] N/A (rationale) — security
- [ ] N/A (rationale) — easier orchestration

**STT Options**
- [ ] Missing — Faster-Whisper
- [x] Implemented — Whisper API
- [ ] Missing — Deepgram
- [ ] Missing — AssemblyAI

**PDF / OCR Tools**
- [ ] Missing — Docling
- [ ] Missing — OpenDataLoader
- [ ] Missing — Tesseract
- [ ] Missing — OCR.space

**Chunking Strategy**
- [ ] Partial — 300–800 tokens
- [ ] Partial — overlap: 10–20%

**Embedding Models**
- [ ] Partial — text-embedding-3-small
- [ ] Missing — sentence-transformers

**Vector Database**
- [x] Implemented — Qdrant
- [ ] Missing — Chroma
- [ ] N/A (guideline) — Pinecone (cost scaling)
- [ ] N/A (guideline) — Weaviate (heavy operational complexity)

**Session Memory Design — Redis Stores**
- [x] Implemented — rolling transcript
- [ ] Partial — session metadata
- [ ] Partial — timestamps
- [ ] Partial — interaction history

**Session Memory Design — Vector DB Stores**
- [x] Implemented — semantic chunks
- [x] Implemented — embeddings
- [ ] Partial — document references

**LLM Design — Allowed Behaviors**
- [ ] Partial — ask questions
- [ ] Partial — probe reasoning
- [ ] Partial — identify missing concepts
- [ ] Partial — request clarification

**LLM Design — Forbidden Behaviors**
- [ ] Partial — direct teaching
- [ ] Partial — giving full answers
- [ ] Partial — changing topics
- [ ] Partial — generic conversation

**Prompt Design Principles**
- [ ] Partial — constrain topic scope
- [ ] Partial — prohibit explanations
- [ ] Partial — enforce probing behavior
- [ ] Partial — restrict responses to uploaded materials

**Intermediate Prompt Behavior**
- [ ] Partial — minimal output
- [ ] Partial — short probing question
- [ ] Partial — no long reasoning

**Final Prompt Behavior**
- [ ] Partial — full evaluation
- [ ] Partial — conceptual analysis
- [ ] Partial — understanding breakdown
- [ ] Partial — improvement recommendations

**Suggested Database Schema — Users**
- [x] Implemented — id
- [x] Implemented — email
- [x] Implemented — createdAt

**Suggested Database Schema — Sessions**
- [x] Implemented — id
- [x] Implemented — userId
- [x] Implemented — topic
- [x] Implemented — startedAt
- [x] Implemented — endedAt

**Suggested Database Schema — Resources**
- [x] Implemented — id
- [ ] Missing — sessionId
- [ ] Missing — filePath
- [ ] Missing — parsedText

**Suggested Database Schema — TranscriptChunks**
- [x] Implemented — id
- [x] Implemented — sessionId
- [ ] Partial — timestamp
- [x] Implemented — transcript

**Suggested Database Schema — Embeddings**
- [ ] Missing — id
- [ ] Missing — sessionId
- [ ] Missing — chunkId
- [ ] Missing — vector

**Suggested Database Schema — Evaluations**
- [x] Implemented — id
- [x] Implemented — sessionId
- [ ] Missing — summary
- [ ] Missing — weaknesses
- [ ] Missing — confidenceScore

**API Design — Session**
- [x] Implemented — POST /sessions/create
- [x] Implemented — POST /sessions/:id/end

**API Design — Uploads**
- [ ] Partial — POST /upload

**API Design — Evaluation**
- [ ] Missing — GET /sessions/:id/report

**WebSocket Events — Client → Server**
- [ ] Partial — audio_chunk
- [ ] Partial — session_start
- [ ] Partial — session_end

**WebSocket Events — Server → Client**
- [x] Implemented — transcript_update
- [x] Implemented — probing_question
- [ ] Missing — session_summary

**Real-Time Processing Logic — Every 2–5 Seconds**
- [x] Implemented — receive audio chunk
- [x] Implemented — transcribe
- [x] Implemented — append transcript

**Real-Time Processing Logic — Every 20–30 Seconds**
- [ ] Partial — retrieve relevant chunks
- [ ] Partial — LLM analysis
- [ ] Partial — probing question generation

**Real-Time Processing Logic — Session End**
- [ ] Partial — full evaluation generation

**Cost Optimization Strategy**
- [ ] Partial — STT only
- [ ] Partial — LLM reasoning
- [ ] Partial — Deep analysis

**Scaling Considerations — Future Bottlenecks**
- [ ] N/A (observation) — STT
- [ ] N/A (observation) — Vector Search
- [ ] N/A (observation) — LLM Calls

**Scaling Strategy — Early Stage**
- [ ] N/A (architecture choice) — single server

**Scaling Strategy — Mid Stage**
- [ ] Missing — STT worker
- [ ] Missing — embedding worker
- [ ] Missing — LLM worker

**Scaling Strategy — Large Scale**
- [ ] Missing — microservices + queues

**Security Considerations**
- [ ] Partial — validate uploads
- [ ] Missing — rate-limit websocket connections
- [ ] Partial — sanitize parsed text
- [ ] Partial — isolate user sessions
- [ ] Partial — secure API keys
- [ ] N/A (frontend) — avoid frontend secret exposure

**Analytics Ideas**
- [ ] Missing — speaking confidence
- [ ] Missing — hesitation detection
- [ ] Missing — concept coverage
- [ ] Missing — explanation depth
- [ ] Missing — semantic consistency
- [ ] Missing — topic drift

**Major Risks — Risk 1 Mitigation**
- [ ] Partial — constrained prompts
- [ ] Partial — retrieval grounding
- [ ] Partial — domain restriction

**Major Risks — Risk 2 Mitigation**
- [ ] Partial — strict probing prompts
- [ ] Partial — topic constraints
- [ ] Partial — retrieval-only context

**Major Risks — Risk 3 Mitigation**
- [ ] Partial — periodic reasoning only
- [ ] Partial — lightweight models
- [ ] Partial — cached retrieval

**MVP Milestones — Phase 1**
- [x] Implemented — upload resources
- [x] Implemented — parse text
- [x] Implemented — generate embeddings

**MVP Milestones — Phase 2**
- [x] Implemented — websocket audio streaming
- [x] Implemented — speech-to-text pipeline

**MVP Milestones — Phase 3**
- [x] Implemented — vector retrieval
- [x] Implemented — LLM probing questions

**MVP Milestones — Phase 4**
- [ ] Partial — final evaluation report

**MVP Milestones — Phase 5**
- [ ] Missing — analytics
- [ ] Missing — optimization
- [ ] Missing — scaling

**Non-Goals**
- [ ] N/A (product constraint) — build general AI assistant
- [ ] N/A (product constraint) — support all subjects immediately
- [ ] N/A (product constraint) — add social features early
- [ ] N/A (product constraint) — add avatars initially
- [ ] N/A (product constraint) — overengineer multi-agent systems

**Focus**
- [ ] Partial — reliable understanding evaluation
- [ ] Partial — deep conceptual probing
- [ ] Partial — strong retrieval grounding

**URL Ingestion**
- **Trace** `createResourceHandler` only calls `ingestResourceText` when `sourceType` is `TEXT`, so `URL` resources remain “ingestion pending.” See resource.controller.ts.
- **Trace** `CreateResourceSchema` requires `sourceUrl` for `URL` but does not trigger ingestion. See resource.validation.ts.
- **Trace** Upload parsing and ingestion exist only on the document parser path. See document-parser.controller.ts and document-parser.route.ts.
- **Trace** The ingestion pipeline is centralized in `ingestResourceText`. See resource-ingest.service.ts.

**URL Ingestion Plan**
- **Plan** Add a URL fetch+extract module that downloads `sourceUrl`, enforces size/time limits, detects content type, and extracts readable text (HTML → readability, non‑HTML → temp file parse using the existing upload parsing flow).
- **Plan** Extend `createResourceHandler` to handle `sourceType === 'URL'` by calling the URL extractor and then `ingestResourceText`, returning 201 when complete or 202 if queued. See resource.controller.ts.
- **Plan** Use `updateResourceStatus` to mark PROCESSING/READY/FAILED and surface errors cleanly. See resource.service.ts.
- **Plan** Keep chunking/embedding identical by reusing `ingestResourceText`. See resource-ingest.service.ts.
- **Plan** Optionally store fetched artifacts in object storage using `buildResourceStorageKey` and `uploadBufferToS3`, then set `storageKey` on the resource. See storage.service.ts.
- **Plan** Add tests for URL ingestion success/failure cases and validate that `CreateResourceSchema` behavior remains correct. See resource.validation.ts.

If you want me to implement URL ingestion now, pick one:
1) Synchronous ingestion in `createResourceHandler`.  
2) Async ingestion via a queue with status polling.