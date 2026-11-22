# API Contracts & Specification

## Base URLs
- Public Backend API: `http://localhost:5000/api/v1`
- Internal AI Service API: `http://localhost:8000/internal/v1`
- AI Service Health: `http://localhost:8000/health`

---

## 1. Standard Response Envelope

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-11-22T10:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | AI_PROVIDER_ERROR | RATE_LIMIT_EXCEEDED",
    "message": "Human readable error description",
    "details": []
  }
}
```

---

## 2. Public Node.js API Endpoints

### 2.1 Authentication (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
**Body:**
```json
{
  "name": "Alex Mercer",
  "email": "alex@example.com",
  "password": "Password123!"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Alex Mercer",
      "email": "alex@example.com",
      "createdAt": "2026-11-22T10:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

#### `POST /api/v1/auth/login`
**Body:**
```json
{
  "email": "alex@example.com",
  "password": "Password123!"
}
```
**Response (200 OK):** Same as register.

#### `POST /api/v1/auth/logout`
**Headers:** `Authorization: Bearer <token>`
**Response (200 OK):**
```json
{
  "success": true,
  "data": { "message": "Successfully logged out" }
}
```

#### `GET /api/v1/auth/me`
**Headers:** `Authorization: Bearer <token>`
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "createdAt": "2026-11-22T10:00:00.000Z"
  }
}
```

---

### 2.2 Content & Generation (`/api/v1/content`)

All requests require `Authorization: Bearer <token>`.

#### `POST /api/v1/content/generate`
**Body:**
```json
{
  "title": "The Future of AI in Education",
  "contentType": "blog",
  "tone": "informative",
  "length": "medium",
  "targetAudience": "University students",
  "keywords": ["AI", "personalized learning", "future"],
  "context": "Discuss benefits and limitations",
  "referenceText": ""
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "The Future of AI in Education",
    "content": "Full markdown or formatted text...",
    "contentType": "blog",
    "tone": "informative",
    "length": "medium",
    "createdAt": "2026-11-22T10:00:00.000Z",
    "updatedAt": "2026-11-22T10:00:00.000Z",
    "version": 1
  },
  "meta": {
    "model": "gemini-1.5-flash",
    "latencyMs": 1420
  }
}
```

#### `POST /api/v1/content/:id/refine`
**Body:**
```json
{
  "action": "simplify",
  "instruction": "Make the language accessible for first-year students",
  "scope": "full",
  "selectedText": null,
  "currentContent": "Optional updated draft text before refining"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "The Future of AI in Education",
    "content": "Refined content...",
    "version": 2,
    "changeType": "refined",
    "updatedAt": "2026-11-22T10:05:00.000Z"
  }
}
```

#### `POST /api/v1/content/:id/variations`
Generates up to 3 variations based on current content parameters.
**Body:**
```json
{
  "count": 3
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "variations": [
      { "id": 1, "title": "Alternative 1", "content": "..." },
      { "id": 2, "title": "Alternative 2", "content": "..." },
      { "id": 3, "title": "Alternative 3", "content": "..." }
    ]
  }
}
```

#### `GET /api/v1/content`
Query Parameters:
- `search`: string (matches title and content)
- `contentType`: string (optional filter)
- `sortBy`: `updatedAt` | `title` | `createdAt` (default: `updatedAt`)
- `sortOrder`: `asc` | `desc` (default: `desc`)
- `page`: number (default: 1)
- `limit`: number (default: 10, max: 50)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "...",
        "contentSnippet": "...",
        "contentType": "blog",
        "tone": "informative",
        "length": "medium",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

#### `GET /api/v1/content/:id`
Retrieves a single content item with its latest content and version count.

#### `PATCH /api/v1/content/:id`
Update title and/or content directly (creates an "edited" version snapshot).
**Body:**
```json
{
  "title": "New Title",
  "content": "Edited content"
}
```

#### `DELETE /api/v1/content/:id`
Deletes content and cascaded versions.

#### `GET /api/v1/content/:id/versions`
Lists all version history snapshots for the given content.

#### `GET /api/v1/content/:id/versions/:versionId`
Retrieves a specific historical snapshot.

---

## 3. Internal FastAPI Service (`/internal/v1`)

Headers required:
- `Authorization: Bearer <AI_SERVICE_TOKEN>`
- `x-request-id: <uuid>`

#### `POST /internal/v1/generate`
Input:
```json
{
  "title": "Title",
  "contentType": "blog",
  "tone": "informative",
  "length": "medium",
  "targetAudience": "Audience",
  "keywords": ["keyword1"],
  "context": "Context instructions",
  "referenceText": "Reference text"
}
```
Output:
```json
{
  "title": "Suggested or normalized title",
  "content": "Generated content text",
  "model": "gemini-1.5-flash",
  "usage": {
    "inputTokens": 120,
    "outputTokens": 450
  }
}
```

#### `POST /internal/v1/refine`
Input:
```json
{
  "content": "Original text",
  "action": "rewrite | improve_grammar | simplify | expand | shorten | change_tone | improve_readability",
  "instruction": "Specific instructions",
  "scope": "full | partial",
  "selectedText": null
}
```
Output:
```json
{
  "content": "Refined content",
  "action": "simplify",
  "model": "gemini-1.5-flash"
}
```

#### `POST /internal/v1/variations`
Input:
```json
{
  "title": "Title",
  "content": "Current text",
  "contentType": "blog",
  "tone": "informative",
  "count": 3
}
```
Output:
```json
{
  "variations": [
    { "index": 1, "content": "..." },
    { "index": 2, "content": "..." },
    { "index": 3, "content": "..." }
  ],
  "model": "gemini-1.5-flash"
}
```

#### `GET /health`
Output:
```json
{
  "status": "healthy",
  "service": "ai-service",
  "version": "1.0.0"
}
```
