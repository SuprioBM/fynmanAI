# Feynman AI API Documentation

This document describes the REST API exposed by the Feynman AI server.

Default local base URL:

```text
http://localhost:8000
```

All application endpoints are mounted under `/api` unless noted otherwise.

## Response Format

Most JSON endpoints return one of these envelopes:

```json
{
  "success": true,
  "message": "Optional success message",
  "data": {}
}
```

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {}
}
```

`message` and `data` are omitted when not provided. `errors` is usually included for validation or parser details.

## Authentication

Protected endpoints require an access token:

```http
Authorization: Bearer <accessToken>
```

The server also stores `accessToken` and `refreshToken` in HTTP-only cookies during sign-in, sign-up via OAuth callback, and refresh. Protected REST endpoints still read the bearer token from the `Authorization` header.

Common authentication errors:

| Status | Message |
| --- | --- |
| `401` | `Unauthorized` |
| `401` | `Invalid token payload` |
| `401` | `Invalid or expired session` |
| `401` | `Invalid or expired token` |
| `401` | `User not authenticated` |

## Rate Limits

The server applies rate limits and returns these headers:

| Header | Description |
| --- | --- |
| `RateLimit-Limit` | Maximum allowed requests in the current window. |
| `RateLimit-Remaining` | Requests remaining in the current window. |
| `RateLimit-Reset` | Unix timestamp when the current window resets. |
| `Retry-After` | Present only on `429` responses. |

Defaults:

| Area | Prefix | Default Limit |
| --- | --- | --- |
| Auth | `/api/auth` | 30 requests per 15 minutes |
| Parser upload | `/api/parser` | 20 requests per minute |
| General API | `/api` | 300 requests per minute |

Rate limit error:

```json
{
  "success": false,
  "message": "Rate limit exceeded"
}
```

## Common Validation Errors

Requests validated by Zod return `400`:

```json
{
  "success": false,
  "message": "Validation message",
  "errors": {
    "fieldName": ["Field-specific message"]
  }
}
```

## Public Utility Routes

### GET `/`

Returns a plain text server greeting.

Success:

```text
Hello from Tryora!
```

### GET `/api`

Checks that the API is reachable.

Success `200`:

```json
{
  "success": true,
  "message": "Tryora API is running!"
}
```

### HEAD `/health`

Lightweight liveness check.

Success `200`:

```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2026-05-29T00:00:00.000Z",
    "uptime": 123.45
  }
}
```

### GET `/health`

### GET `/api/health`

Returns full system health. The same route is available at both paths.

Success status:

| HTTP Status | Health Status |
| --- | --- |
| `200` | `ok` |
| `207` | `degraded` |
| `503` | `down` |

Success response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-05-29T00:00:00.000Z",
    "uptime": 123.45,
    "components": {
      "database": { "status": "ok", "latencyMs": 12 },
      "redis": { "status": "ok", "latencyMs": 8, "details": { "ping": "PONG" } },
      "qdrant": { "status": "ok", "latencyMs": 10 },
      "queues": { "status": "ok", "latencyMs": 5 },
      "stt": { "status": "ok", "details": { "provider": "openai-whisper", "model": "whisper-1", "configured": true } },
      "parser": { "status": "ok", "latencyMs": 40 },
      "llm": { "status": "ok", "details": { "provider": "openrouter", "chatModelConfigured": true, "embeddingProvider": "openrouter", "embeddingModelConfigured": true } }
    }
  }
}
```

## Auth Routes

Base path: `/api/auth`

### POST `/api/auth/signup`

Creates a password account. If an OAuth-created user exists without a password, this links a password to that account.

Request body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | Yes | Minimum 2 characters. |
| `email` | string | Yes | Valid email address. |
| `password` | string | Yes | Minimum 8 characters, at least one letter, one number, and one special character. |

Success `201`:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": null,
      "emailVerified": false,
      "isActive": true,
      "userBodyImageUrl": null,
      "age": null
    }
  }
}
```

Account-link success `200`:

```json
{
  "success": true,
  "message": "Account linked successfully",
  "data": {
    "user": {}
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | Zod validation message. |
| `400` | `Email, password and name are required` |
| `400` | `User already exists` |
| `500` | `user creation failed` |

### POST `/api/auth/signin`

Authenticates with email and password. Sets `refreshToken` and `accessToken` HTTP-only cookies and also returns both tokens in the response body.

Request body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | Yes | Valid email address. |
| `password` | string | Yes | Same password rules as sign-up. |

Success `200`:

```json
{
  "success": true,
  "message": "Signin successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": "https://example.com/avatar.png",
      "emailVerified": true,
      "isActive": true,
      "userBodyImageUrl": "https://example.com/body.png",
      "age": 22
    },
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | Zod validation message. |
| `400` | `Email and password are required` |
| `400` | `Invalid email or password` |

### GET `/api/auth/refresh`

Rotates the refresh token and creates a new authenticated session.

Requires cookie:

| Cookie | Required |
| --- | --- |
| `refreshToken` | Yes |

Success `200`:

```json
{
  "success": true,
  "message": "Token refreshed"
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | `Refresh token missing` |
| `401` | `Invalid refresh token` |
| `401` | `Invalid Refresh Token` |

### GET `/api/auth/signout`

Protected. Revokes the current session, clears auth cookies, and destroys the server session.

Success `200`:

```json
{
  "success": true,
  "message": "Signout success"
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `500` | `Signout failed` |

### GET `/api/auth/google`

Starts Google OAuth. Redirects the browser to Google's consent flow.

No JSON response is returned by this endpoint.

### GET `/api/auth/google/callback`

Google OAuth callback. On success, creates tokens and redirects to the frontend callback URL with user and token data in query parameters:

```text
<FRONTEND_URL>/api/auth/google/callback?id=...&email=...&name=...&avatar=...&emailVerified=...&isActive=...&accessToken=...&refreshToken=...&userBodyImageUrl=...&age=...
```

On failure, redirects to:

```text
<FRONTEND_URL>/auth/failure
```

Possible JSON error only if Passport succeeds but `req.user` is missing:

| Status | Message |
| --- | --- |
| `401` | `Authentication failed` |

### GET `/api/auth/google/failure`

Redirects to:

```text
<FRONTEND_URL>/auth/failure
```

## User Routes

Base path: `/api/user`

### POST `/api/user/forgot-password`

Requests a password reset email. The response is intentionally the same whether or not the email exists.

Request body:

| Field | Type | Required |
| --- | --- | --- |
| `email` | string | Yes |

Success `200`:

```json
{
  "success": true,
  "message": "If that email is registered, a reset link has been sent"
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | `Email is required` |
| `500` | `Failed to process forgot password request` |

### POST `/api/user/reset-password`

Resets a password using a verification/reset token.

Request body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `token` | string | Yes | Token from reset link. |
| `newPassword` | string | Yes | Minimum 8 characters. |
| `confirmPassword` | string | Yes | Must match `newPassword`. |

Success `200`:

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | `Token and password fields are required` |
| `400` | `Passwords do not match` |
| `400` | `Password must be at least 8 characters long` |
| `400` | `Invalid or expired token` |
| `500` | `Failed to reset password` |

### POST `/api/user/verify-email`

Verifies a user's email address.

Request body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `token` | string | Yes | Verification token. |
| `userId` | string | No | If omitted, the server resolves the user by token. |

Success `200`:

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | `Verification token is required` |
| `400` | `Invalid or expired token` |
| `500` | `Failed to verify email` |

### POST `/api/user/resend-verification-email`

Current implementation expects `req.userId`, but this route is mounted before `authMiddleware`. Unless another middleware sets `req.userId`, it returns unauthenticated.

Intended request:

```http
Authorization: Bearer <accessToken>
```

Success `200`:

```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | `User not authenticated` |
| `404` | `User not found` |
| `400` | `Email is already verified` |
| `500` | `Failed to send verification email` |

### GET `/api/user/me`

Protected. Returns the authenticated user's profile.

Success `200`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "avatarUrl": "https://example.com/avatar.png",
      "userBodyImageUrl": "https://example.com/body.png",
      "age": 22,
      "ethnicity": "string",
      "gender": "UNISEX",
      "interests": ["math", "physics"],
      "location": "string",
      "verificationToken": "token",
      "emailVerified": true,
      "isActive": true,
      "createdAt": "2026-05-29T00:00:00.000Z",
      "updatedAt": "2026-05-29T00:00:00.000Z"
    }
  }
}
```

Sensitive fields removed from this response: `passwordHash`, `oauthProvider`, `oauthId`, and `deletedAt`.

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `User not found` |
| `500` | `Failed to fetch user profile` |

### PATCH `/api/user/me`

Protected. Updates profile fields.

Request body: at least one field is required.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | No | Cannot be empty. |
| `avatarUrl` | string | No | Must be a URL. |
| `userBodyImageUrl` | string | No | Must be a URL. |
| `age` | number | No | Minimum 0. |
| `gender` | string | No | Stored as provided; Prisma enum is `MALE`, `FEMALE`, `UNISEX`. |
| `location` | string | No |  |
| `interests` | string[] | No |  |
| `ethnicity` | string | No |  |

Success `200`:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {}
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | Validation message. |
| `401` | Authentication errors. |
| `500` | `Failed to update user profile` |

### POST `/api/user/change-password`

Protected. Changes the password for the current user.

Request body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `currentPassword` | string | Yes | Cannot be empty. |
| `newPassword` | string | Yes | Minimum 8 characters, at least one letter, one number, and one special character. |
| `confirmPassword` | string | Yes | Must match `newPassword`. |

Success `200`:

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | Validation message. |
| `400` | `User account does not have a password set` |
| `401` | Authentication errors. |
| `401` | `Current password is incorrect` |
| `404` | `User not found` |
| `500` | `Failed to change password` |

### DELETE `/api/user/delete-account`

Protected. Soft-deletes the current account, revokes refresh tokens, clears cache, and clears auth cookies.

Request body:

| Field | Type | Required |
| --- | --- | --- |
| `password` | string | Yes |

Success `200`:

```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | `Password is required to delete account` |
| `400` | `Cannot delete account without password verification` |
| `401` | Authentication errors. |
| `401` | `Password is incorrect` |
| `404` | `User not found` |
| `500` | `Failed to delete account` |

## Resource Routes

Base path: `/api/resources`

All resource routes are protected.

Resource statuses:

```text
PENDING | PROCESSING | READY | FAILED
```

Resource source types:

```text
TEXT | UPLOAD | URL
```

### GET `/api/resources`

Lists resources owned by the authenticated user.

Query parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | string | No | One of `PENDING`, `PROCESSING`, `READY`, `FAILED`. Invalid values are ignored. |
| `subject` | string | No | Exact filter. |
| `topic` | string | No | Exact filter. |

Success `200`:

```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "uuid",
        "userId": "uuid",
        "title": "Newton Notes",
        "sourceType": "TEXT",
        "mimeType": null,
        "sourceUrl": null,
        "storageKey": null,
        "filePath": null,
        "parsedText": "text",
        "status": "READY",
        "subject": "physics",
        "topic": "motion",
        "metadata": {},
        "createdAt": "2026-05-29T00:00:00.000Z",
        "updatedAt": "2026-05-29T00:00:00.000Z",
        "_count": {
          "chunks": 3,
          "sessions": 1
        }
      }
    ]
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `500` | `Failed to list resources` |

### POST `/api/resources`

Creates a resource and starts ingestion depending on `sourceType`.

Request body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Cannot be empty. |
| `sourceType` | string | Yes | `TEXT`, `UPLOAD`, or `URL`. |
| `text` | string | Required for `TEXT` | Ingested immediately. |
| `mimeType` | string | No | Useful for upload/url resources. |
| `sourceUrl` | string | Required for `URL` | Must be a valid URL. URL ingestion is queued. |
| `storageKey` | string | Required for `UPLOAD` | Upload resources created here are marked pending; parsing can be done through `/api/parser/parse`. |
| `subject` | string | No |  |
| `topic` | string | No |  |
| `metadata` | object | No | Arbitrary JSON object. |

TEXT success `201`:

```json
{
  "success": true,
  "message": "Resource ingested",
  "data": {
    "resource": {},
    "ingest": {
      "chunkCount": 3
    }
  }
}
```

URL success `202`:

```json
{
  "success": true,
  "message": "Resource created. URL ingestion queued.",
  "data": {
    "resource": {},
    "jobId": "job-id"
  }
}
```

UPLOAD or pending success `202`:

```json
{
  "success": true,
  "message": "Resource created. Ingestion pending.",
  "data": {
    "resource": {}
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | Zod validation message, including `Text is required for TEXT resources`, `sourceUrl is required for URL resources`, or `storageKey is required for UPLOAD resources`. |
| `401` | Authentication errors. |
| `500` | `Failed to create resource` |

### GET `/api/resources/ingestion/observability`

Returns status counts for the user's resources and URL-ingest queue counts.

Success `200`:

```json
{
  "success": true,
  "data": {
    "resources": {
      "PENDING": 0,
      "PROCESSING": 1,
      "READY": 5,
      "FAILED": 0
    },
    "queues": {
      "urlIngest": {
        "waiting": 0,
        "active": 0,
        "completed": 10,
        "failed": 1,
        "delayed": 0,
        "paused": 0
      }
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `500` | `Failed to fetch ingestion observability` |

### GET `/api/resources/:resourceId/ingestion`

Returns ingestion state for one resource.

Path parameters:

| Name | Type | Required |
| --- | --- | --- |
| `resourceId` | string | Yes |

Success `200`:

```json
{
  "success": true,
  "data": {
    "resourceId": "uuid",
    "status": "READY",
    "sourceType": "URL",
    "chunkCount": 8,
    "jobState": "completed"
  }
}
```

`jobState` is only checked for URL resources; otherwise it is `null`.

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Resource not found` |
| `500` | `Failed to fetch resource ingestion status` |

### POST `/api/resources/:resourceId/retry`

Retries ingestion for a resource.

Path parameters:

| Name | Type | Required |
| --- | --- | --- |
| `resourceId` | string | Yes |

Request body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `text` | string | No | Optional replacement text for non-URL resources. If omitted, the server uses the resource's `parsedText`. |

URL resource success `202`:

```json
{
  "success": true,
  "message": "Resource ingestion queued",
  "data": {
    "resource": {},
    "jobId": "job-id"
  }
}
```

Text retry success `200`:

```json
{
  "success": true,
  "message": "Resource ingestion retried",
  "data": {
    "resource": {},
    "ingest": {}
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | `No parsed text is available to retry. Re-upload or parse the document first.` |
| `401` | Authentication errors. |
| `404` | `Resource not found` |
| `409` | `Resource ingestion is already in progress` |
| `500` | `Failed to retry resource ingestion` |

### GET `/api/resources/:resourceId`

Returns one resource with its chunks.

Success `200`:

```json
{
  "success": true,
  "data": {
    "resource": {
      "id": "uuid",
      "userId": "uuid",
      "title": "Newton Notes",
      "sourceType": "TEXT",
      "status": "READY",
      "chunks": [
        {
          "id": "uuid",
          "resourceId": "uuid",
          "chunkIndex": 0,
          "text": "chunk text",
          "embeddingModel": "model-name",
          "vectorId": "vector-id",
          "metadata": {},
          "createdAt": "2026-05-29T00:00:00.000Z"
        }
      ]
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Resource not found` |
| `500` | `Failed to fetch resource` |

### PATCH `/api/resources/:resourceId`

Updates editable metadata for a resource.

Request body:

| Field | Type | Required |
| --- | --- | --- |
| `title` | string | No |
| `subject` | string or null | No |
| `topic` | string or null | No |
| `metadata` | object or null | No |

Success `200`:

```json
{
  "success": true,
  "message": "Resource updated",
  "data": {
    "resource": {}
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | Zod validation message. |
| `401` | Authentication errors. |
| `404` | `Resource not found` |
| `500` | `Failed to update resource` |

### DELETE `/api/resources/:resourceId`

Deletes a resource and its vector points.

Success `200`:

```json
{
  "success": true,
  "message": "Resource deleted",
  "data": {
    "resourceId": "uuid"
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Resource not found` |
| `500` | `Failed to delete resource` |

## Session Routes

Base path: `/api/sessions`

All session routes are protected.

Session statuses:

```text
ACTIVE | ENDED
```

Evaluation types:

```text
ROLLING | FINAL
```

### GET `/api/sessions`

Lists sessions owned by the authenticated user.

Query parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | string | No | `ACTIVE` or `ENDED`. Invalid values are ignored. |

Success `200`:

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "userId": "uuid",
        "subject": "physics",
        "topic": "motion",
        "goal": "Explain Newton's laws",
        "status": "ACTIVE",
        "startedAt": "2026-05-29T00:00:00.000Z",
        "endedAt": null,
        "createdAt": "2026-05-29T00:00:00.000Z",
        "updatedAt": "2026-05-29T00:00:00.000Z",
        "_count": {
          "transcriptChunks": 4,
          "evaluations": 1,
          "resources": 2
        },
        "evaluations": []
      }
    ]
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `500` | `Failed to list sessions` |

### POST `/api/sessions`

Starts a session and optionally attaches existing ready resources.

Request body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `subject` | string | No | Normalized by domain service. |
| `topic` | string | No | Normalized by domain service. |
| `goal` | string | No | Learning goal for evaluation. |
| `resourceIds` | string[] | No | Resources must exist, belong to the user, be `READY`, and match subject/topic if those fields are set on the resource. |

Success `201`:

```json
{
  "success": true,
  "message": "Session started",
  "data": {
    "session": {
      "id": "uuid",
      "userId": "uuid",
      "subject": "physics",
      "topic": "motion",
      "goal": "Explain Newton's laws",
      "status": "ACTIVE",
      "startedAt": "2026-05-29T00:00:00.000Z",
      "endedAt": null,
      "createdAt": "2026-05-29T00:00:00.000Z",
      "updatedAt": "2026-05-29T00:00:00.000Z"
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | Zod validation message. |
| `400` | `Unsupported subject...` |
| `400` | `Invalid session resources: ...` |
| `401` | Authentication errors. |
| `500` | `Failed to start session` |

### GET `/api/sessions/:sessionId`

Returns session details, transcript chunks, resources, and evaluations.

Success `200`:

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "userId": "uuid",
      "subject": "physics",
      "topic": "motion",
      "goal": "Explain Newton's laws",
      "status": "ACTIVE",
      "transcriptChunks": [],
      "evaluations": [
        {
          "id": "uuid",
          "sessionId": "uuid",
          "type": "ROLLING",
          "content": "{\"questions\":[]}",
          "structured": {
            "questions": [],
            "clarifications": [],
            "detected_gaps": [],
            "topic_drift": false,
            "citations": []
          },
          "citations": [],
          "citedEvidence": [],
          "rubric": [],
          "analytics": {}
        }
      ],
      "resources": []
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Session not found` |
| `500` | `Failed to fetch session` |

### POST `/api/sessions/:sessionId/transcript`

Appends a transcript chunk to a session.

Request body:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `text` | string | Yes | Cannot be empty. The server preprocesses the text before storing it. |
| `startTimeMs` | integer | No | Start timestamp in milliseconds. |
| `endTimeMs` | integer | No | End timestamp in milliseconds. |

Success `201`:

```json
{
  "success": true,
  "message": "Transcript appended",
  "data": {
    "chunk": {
      "id": "uuid",
      "sessionId": "uuid",
      "sequence": 1,
      "text": "processed transcript text",
      "startTimeMs": 0,
      "endTimeMs": 5000,
      "createdAt": "2026-05-29T00:00:00.000Z"
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `400` | `Transcript text is required` |
| `401` | Authentication errors. |
| `404` | `Session not found` |
| `500` | `Failed to append transcript` |

### POST `/api/sessions/:sessionId/feedback`

Generates realtime feedback from the recent transcript window and attached resources.

Request body: none.

Success `200`:

```json
{
  "success": true,
  "data": {
    "evaluation": {
      "id": "uuid",
      "sessionId": "uuid",
      "type": "ROLLING",
      "structured": {
        "questions": ["What assumption are you making here?"],
        "clarifications": [],
        "detected_gaps": [],
        "topic_drift": false,
        "citations": ["C1"]
      },
      "citations": [],
      "citedEvidence": [],
      "rubric": [],
      "analytics": {
        "speakingConfidence": 75,
        "hesitationRate": 0.01,
        "explanationDepth": 70,
        "conceptCoverage": 60,
        "semanticConsistency": 80,
        "topicDrift": false
      }
    }
  }
}
```

If there is no transcript text or realtime feedback is disabled, `evaluation` can be `null`.

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Session not found` |
| `500` | `Failed to generate feedback` |

### POST `/api/sessions/:sessionId/evaluation`

Generates a rolling or final evaluation.

Request body:

| Field | Type | Required | Default |
| --- | --- | --- | --- |
| `type` | string | No | `FINAL`; valid values are `ROLLING` or `FINAL`. |

Success `200`:

```json
{
  "success": true,
  "data": {
    "evaluation": {
      "id": "uuid",
      "sessionId": "uuid",
      "type": "FINAL",
      "summary": "Short mastery summary",
      "structured": {
        "summary": "Short mastery summary",
        "strengths": [],
        "weaknesses": [],
        "missed_concepts": [],
        "follow_up": [],
        "confidence_score": 80,
        "topic_drift": false,
        "cited_evidence": []
      },
      "citations": [],
      "citedEvidence": [],
      "rubric": [],
      "analytics": {}
    }
  }
}
```

If there is no transcript text or final evaluation is disabled, `evaluation` can be `null`.

Errors:

| Status | Message |
| --- | --- |
| `400` | Zod validation message. |
| `401` | Authentication errors. |
| `404` | `Session not found` |
| `500` | `Failed to generate evaluation` |

### GET `/api/sessions/:sessionId/report`

Returns the latest final evaluation for a session.

Success `200`:

```json
{
  "success": true,
  "data": {
    "evaluation": {
      "id": "uuid",
      "sessionId": "uuid",
      "type": "FINAL",
      "content": "raw final evaluation content",
      "summary": "summary",
      "strengths": [],
      "weaknesses": [],
      "missedConcepts": [],
      "followUp": [],
      "confidenceScore": 80,
      "topicDrift": false,
      "provider": "provider",
      "model": "model",
      "metadata": {},
      "createdAt": "2026-05-29T00:00:00.000Z"
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Session not found` |
| `404` | `Final evaluation not available` |
| `500` | `Failed to fetch session report` |

### POST `/api/sessions/:sessionId/end`

Ends a session and ensures a final evaluation exists.

Request body: none.

Success `200`:

```json
{
  "success": true,
  "message": "Session ended",
  "data": {
    "session": {
      "id": "uuid",
      "status": "ENDED",
      "endedAt": "2026-05-29T00:00:00.000Z"
    },
    "evaluation": {}
  }
}
```

`evaluation` can be `null` if final evaluation is disabled or there is no transcript.

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Session not found` |
| `500` | `Failed to end session` |

## Analytics Routes

Base path: `/api/analytics`

All analytics routes are protected.

Date query parameters use JavaScript-compatible date strings. Invalid dates are ignored.

### GET `/api/analytics/sessions/:sessionId`

Returns analytics for one session.

Success `200`:

```json
{
  "success": true,
  "data": {
    "analytics": {
      "session": {
        "id": "uuid",
        "subject": "physics",
        "topic": "motion",
        "goal": "Explain Newton's laws",
        "status": "ENDED",
        "startedAt": "2026-05-29T00:00:00.000Z",
        "endedAt": "2026-05-29T00:10:00.000Z",
        "durationMs": 600000
      },
      "transcript": {
        "chunkCount": 4,
        "wordCount": 500,
        "characterCount": 3000
      },
      "resources": [],
      "evaluations": {
        "total": 2,
        "rolling": 1,
        "final": 1,
        "latestFinal": {
          "id": "uuid",
          "summary": "summary",
          "confidenceScore": 80,
          "topicDrift": false,
          "strengths": [],
          "weaknesses": [],
          "missedConcepts": [],
          "followUp": [],
          "citations": [],
          "citedEvidence": [],
          "createdAt": "2026-05-29T00:00:00.000Z"
        }
      },
      "quality": {
        "speakingConfidence": 75,
        "explanationDepth": 70,
        "conceptCoverage": 60,
        "semanticConsistency": 80,
        "hesitationRate": 0.01,
        "topicDriftEvents": 0
      },
      "events": {
        "total": 3,
        "byType": [
          { "value": "session.created", "count": 1 }
        ]
      }
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Session not found` |
| `500` | `Failed to fetch session analytics` |

### GET `/api/analytics/progress`

Returns aggregate progress for the authenticated user.

Query parameters:

| Name | Type | Required |
| --- | --- | --- |
| `from` | date string | No |
| `to` | date string | No |

Success `200`:

```json
{
  "success": true,
  "data": {
    "progress": {
      "totals": {
        "sessions": 5,
        "activeSessions": 1,
        "endedSessions": 4,
        "finalEvaluations": 4,
        "transcriptChunks": 30,
        "resourcesAttached": 6
      },
      "averages": {
        "confidenceScore": 78.5,
        "sessionDurationMs": 620000
      },
      "subjects": [{ "value": "physics", "count": 3 }],
      "topics": [{ "value": "motion", "count": 2 }],
      "missedConcepts": [{ "value": "inertia", "count": 1 }],
      "trend": [
        {
          "sessionId": "uuid",
          "subject": "physics",
          "topic": "motion",
          "startedAt": "2026-05-29T00:00:00.000Z",
          "confidenceScore": 80,
          "topicDrift": false,
          "missedConcepts": []
        }
      ]
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `500` | `Failed to fetch user progress` |

### GET `/api/analytics/trends`

Returns concept coverage and topic drift trends.

Query parameters:

| Name | Type | Required |
| --- | --- | --- |
| `from` | date string | No |
| `to` | date string | No |

Success `200`:

```json
{
  "success": true,
  "data": {
    "trends": {
      "trend": [
        {
          "evaluationId": "uuid",
          "sessionId": "uuid",
          "type": "FINAL",
          "subject": "physics",
          "topic": "motion",
          "createdAt": "2026-05-29T00:00:00.000Z",
          "conceptCoverage": 75,
          "semanticConsistency": 80,
          "explanationDepth": 70,
          "topicDrift": false,
          "missedConcepts": []
        }
      ],
      "byTopic": [
        {
          "topic": "motion",
          "evaluations": 2,
          "averageConceptCoverage": 75,
          "topicDriftRate": 0,
          "missedConcepts": []
        }
      ]
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `500` | `Failed to fetch concept trends` |

### GET `/api/analytics/sessions/:sessionId/report/export`

Exports the final evaluation report.

Query parameters:

| Name | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `format` | string | No | `json` | Use `markdown` for a Markdown file download. Any other value returns JSON. |

JSON success `200`:

Headers:

```http
Content-Disposition: attachment; filename="feynman-session-<sessionId>-report.json"
```

```json
{
  "success": true,
  "data": {
    "export": {
      "session": {},
      "resources": [],
      "transcript": [],
      "report": {
        "id": "uuid",
        "summary": "summary",
        "strengths": [],
        "weaknesses": [],
        "missedConcepts": [],
        "followUp": [],
        "confidenceScore": 80,
        "topicDrift": false,
        "citations": [],
        "citedEvidence": [],
        "analytics": {},
        "rubric": [],
        "createdAt": "2026-05-29T00:00:00.000Z",
        "rawContent": "raw model content"
      }
    }
  }
}
```

Markdown success `200`:

Headers:

```http
Content-Type: text/markdown; charset=utf-8
Content-Disposition: attachment; filename="feynman-session-<sessionId>-report.md"
```

Response body is Markdown text, not the JSON envelope.

Errors:

| Status | Message |
| --- | --- |
| `401` | Authentication errors. |
| `404` | `Session not found` |
| `404` | `Final evaluation not available` |
| `500` | `Failed to export final evaluation` |

## Document Parser Routes

Base path: `/api/parser`

### GET `/api/parser/health`

Public. Checks whether the document parser is available.

Success `200`:

```json
{
  "success": true,
  "data": {
    "health": {
      "available": true,
      "pythonOk": true,
      "markitdownOk": true,
      "ocrPluginOk": true,
      "details": "optional details"
    }
  }
}
```

Errors:

| Status | Message |
| --- | --- |
| `503` | `Document parser is unavailable` |
| `500` | `Failed to check parser health` |

### POST `/api/parser/parse`

Protected. Uploads a supported document, parses it, creates an `UPLOAD` resource, and ingests parsed text into chunks/vector storage.

Content type:

```http
multipart/form-data
```

Form fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | file | Yes | Uploaded document. |
| `title` | string | No | Defaults to original file name. |
| `subject` | string | No | Stored on created resource and used during ingestion. |
| `topic` | string | No | Stored on created resource and used during ingestion. |

Supported file extensions:

```text
pdf, docx, pptx, txt, md, markdown, png, jpg, jpeg
```

Supported MIME types:

```text
application/pdf
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.openxmlformats-officedocument.presentationml.presentation
text/plain
text/markdown
image/png
image/jpeg
```

Maximum file size defaults to `DOC_PARSER_MAX_FILE_SIZE_MB`, then `MAX_FILE_SIZE_MB`, then `25` MB.

Success `201`:

```json
{
  "success": true,
  "message": "Document parsed and ingested",
  "data": {
    "resource": {
      "id": "uuid",
      "title": "notes.pdf",
      "sourceType": "UPLOAD",
      "mimeType": "application/pdf",
      "status": "READY",
      "subject": "physics",
      "topic": "motion",
      "metadata": {
        "parser": {
          "fileType": "pdf",
          "hasOCR": true,
          "warnings": []
        },
        "fileName": "notes.pdf",
        "fileSize": 12345
      }
    },
    "ingest": {},
    "parser": {
      "metadata": {
        "fileType": "pdf",
        "hasOCR": true,
        "warnings": []
      }
    }
  }
}
```

Upload errors:

| Status | Message |
| --- | --- |
| `400` | `Unsupported file type` |
| `400` | `File exceeds size limit` |
| `400` | `Upload failed` |
| `400` | `Upload a document file to parse` |
| `401` | Authentication errors. |

Parser errors:

The parser can return its own status and details through `DocumentParserError`.

Known parser error codes:

```text
PYTHON_NOT_FOUND
SCRIPT_NOT_FOUND
INVALID_FILE_TYPE
INVALID_INPUT
FILE_TOO_LARGE
PARSE_TIMEOUT
PARSE_FAILED
OUTPUT_PARSE_ERROR
MISSING_DEPENDENCY
UNSAFE_PATH
EMPTY_OUTPUT
INTERNAL_ERROR
```

Parser error shape:

```json
{
  "success": false,
  "message": "Parser error message",
  "errors": "Parser details"
}
```

Fallback error:

| Status | Message |
| --- | --- |
| `500` | `Failed to parse document` |

## Not Found

Any route not matched by the server returns:

Status `404`:

```json
{
  "success": false,
  "message": "Route not found"
}
```

## Core Data Shapes

### User

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "avatarUrl": "https://example.com/avatar.png",
  "userBodyImageUrl": "https://example.com/body.png",
  "age": 22,
  "ethnicity": "string",
  "gender": "UNISEX",
  "interests": ["math"],
  "location": "string",
  "verificationToken": "token",
  "emailVerified": false,
  "isActive": true,
  "createdAt": "2026-05-29T00:00:00.000Z",
  "updatedAt": "2026-05-29T00:00:00.000Z",
  "deletedAt": null
}
```

### Resource

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Resource title",
  "sourceType": "TEXT",
  "mimeType": "text/plain",
  "sourceUrl": null,
  "storageKey": null,
  "filePath": null,
  "parsedText": "parsed or source text",
  "status": "READY",
  "subject": "physics",
  "topic": "motion",
  "metadata": {},
  "createdAt": "2026-05-29T00:00:00.000Z",
  "updatedAt": "2026-05-29T00:00:00.000Z"
}
```

### Session

```json
{
  "id": "uuid",
  "userId": "uuid",
  "subject": "physics",
  "topic": "motion",
  "goal": "Explain Newton's laws",
  "status": "ACTIVE",
  "startedAt": "2026-05-29T00:00:00.000Z",
  "endedAt": null,
  "createdAt": "2026-05-29T00:00:00.000Z",
  "updatedAt": "2026-05-29T00:00:00.000Z"
}
```

### Transcript Chunk

```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "sequence": 1,
  "text": "transcript text",
  "startTimeMs": 0,
  "endTimeMs": 5000,
  "createdAt": "2026-05-29T00:00:00.000Z"
}
```

### Evaluation

```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "type": "FINAL",
  "content": "raw model content",
  "summary": "summary",
  "strengths": [],
  "weaknesses": [],
  "missedConcepts": [],
  "followUp": [],
  "confidenceScore": 80,
  "topicDrift": false,
  "provider": "provider",
  "model": "model",
  "metadata": {},
  "createdAt": "2026-05-29T00:00:00.000Z",
  "structured": {},
  "citations": [],
  "citedEvidence": [],
  "rubric": [],
  "analytics": {}
}
```
