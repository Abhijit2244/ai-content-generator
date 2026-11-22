# API Contracts & Specification

Comprehensive specification of public and internal service endpoints, authentication models, request/response envelopes, security headers, and rate-limiting contracts.

---

## Base URLs
- **Public Backend API**: `http://localhost:5000/api/v1`
- **Internal AI Service API**: `http://localhost:8000/internal/v1`
- **AI Service Health**: `http://localhost:8000/health`
- **Backend Health**: `http://localhost:5000/health`

---

## 1. Standard Response Envelope

All API responses follow a structured envelope format:

### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "4873f72a-...",
    "timestamp": "2026-11-22T10:00:00.000Z"
  }
}
```

### Error Response (HTTP 400 / 401 / 403 / 404 / 429 / 500)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | RATE_LIMIT_EXCEEDED | INTERNAL_SERVER_ERROR",
    "message": "Human readable description of the error",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

## 2. HTTP Security Headers & Transport Policies

All responses issued by the Node.js backend enforce defensive headers:

| Header | Value | Purpose |
| :--- | :--- | :--- |
| `X-Content-Type-Options` | `nosniff` | Blocks MIME-sniffing and cross-origin confusion attacks |
| `X-Frame-Options` | `SAMEORIGIN` | Defends against Clickjacking and UI redressing in malicious iframes |
| `Content-Security-Policy` | `default-src 'self' ...` | Restricts script, style, image, and connect origins |
| `X-Powered-By` | *Suppressed* | Prevents server technology fingerprinting |
| `Access-Control-Allow-Origin` | Explicit Origin Whitelist | Strictly permits only authorized client origins (`localhost:5173`) |

---

## 3. Rate-Limiting Contracts

When a client exceeds allowed request frequencies, the API returns `HTTP 429 Too Many Requests`:

| Endpoint Scope | Threshold Window | Rate Limit Error Code |
| :--- | :--- | :--- |
| `/api/v1/auth/register`, `/api/v1/auth/login` | 30 attempts per 15 minutes per IP | `RATE_LIMIT_EXCEEDED` |
| `/api/v1/content/generate`, `/:id/refine`, `/:id/variations` | 20 operations per 1 minute per user/IP | `RATE_LIMIT_EXCEEDED` |
| `/api/*` (Global Route Guard) | 150 requests per 1 minute per IP | `RATE_LIMIT_EXCEEDED` |

---

## 4. Public Authentication Endpoints (`/api/v1/auth`)

### 4.1 Register User
- **Method**: `POST /api/v1/auth/register`
- **Rate Limit**: 30 req / 15 min
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Validation Rules**:
  - `name`: Min 2, max 100 characters (trimmed)
  - `email`: Valid RFC email format (normalized to lowercase)
  - `password`: Min 8 characters, at least 1 uppercase letter, at least 1 number
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7a0...",
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "createdAt": "2026-11-22T10:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 4.2 Login User
- **Method**: `POST /api/v1/auth/login`
- **Rate Limit**: 30 req / 15 min
- **Timing Defense**: Executes constant-time hash comparison if email does not exist to prevent user enumeration.
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**: Same payload as Register.

### 4.3 Get Current User Profile
- **Method**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "c1f7a0...",
      "name": "Alex Mercer",
      "email": "alex@example.com",
      "createdAt": "2026-11-22T10:00:00.000Z"
    }
  }
  ```

---

## 5. Content Management & AI Endpoints (`/api/v1/content`)

All endpoints in this group require a valid Bearer token (`Authorization: Bearer <token>`).

### 5.1 Generate New Content
- **Method**: `POST /api/v1/content/generate`
- **Rate Limit**: 20 req / 1 min
- **Input Sanitization**: Strings stripped of `<script>`, `<iframe>`, inline event handlers, and `\0`.
- **Request Body**:
  ```json
  {
    "title": "2026 Trends in Edge AI Computing",
    "contentType": "blog",
    "tone": "informative",
    "length": "medium",
    "targetAudience": "Enterprise Architects",
    "keywords": ["edge-ai", "quantization", "latency"],
    "context": "Focus on sub-100ms inference on consumer chips",
    "referenceText": "Empirical data from Stanford HAI report..."
  }
  ```
- **Allowed `contentType`**: `blog`, `social_linkedin`, `social_instagram`, `social_x`, `email`, `marketing`, `product_description`, `study_notes`, `report`, `creative_writing`
- **Allowed `tone`**: `professional`, `casual`, `friendly`, `persuasive`, `informative`, `creative`, `humorous`, `academic`
- **Allowed `length`**: `short`, `medium`, `long`
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "content": {
        "id": "d8a1c4...",
        "title": "2026 Trends in Edge AI Computing",
        "content": "# 2026 Trends in Edge AI Computing\n\n...",
        "contentType": "blog",
        "tone": "informative",
        "length": "medium",
        "version": 1,
        "createdAt": "2026-11-22T10:05:00.000Z",
        "updatedAt": "2026-11-22T10:05:00.000Z"
      },
      "meta": {
        "model": "gemini-2.5-flash",
        "generationTimeMs": 1420,
        "usage": {
          "inputTokens": 280,
          "outputTokens": 450
        }
      }
    }
  }
  ```

### 5.2 Refine Existing Content
- **Method**: `POST /api/v1/content/:id/refine`
- **Rate Limit**: 20 req / 1 min
- **Tenant Security**: Rejects request with 404 if document does not belong to the authenticated user.
- **Request Body**:
  ```json
  {
    "action": "simplify",
    "instruction": "Replace dense jargon with accessible enterprise wording",
    "scope": "full"
  }
  ```
- **Supported Actions**: `rewrite`, `improve_grammar`, `simplify`, `expand`, `shorten`, `change_tone`, `improve_readability`

### 5.3 Generate Variations
- **Method**: `POST /api/v1/content/:id/variations`
- **Rate Limit**: 20 req / 1 min
- **Request Body**:
  ```json
  {
    "count": 3
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "variations": [
        "Option 1: Narrative lead focusing on developer experience...",
        "Option 2: Data-first technical breakdown of benchmarks...",
        "Option 3: Strategic overview for C-level executives..."
      ]
    }
  }
  ```

### 5.4 List Content Library
- **Method**: `GET /api/v1/content`
- **Query Parameters**:
  - `search` (optional): Case-insensitive match on title
  - `contentType` (optional): Filter by format enum
  - `sortBy`: `updatedAt` (default) | `title` | `createdAt`
  - `sortOrder`: `desc` (default) | `asc`
  - `page`: Integer >= 1 (default 1)
  - `limit`: Integer 1 to 50 (default 10)

### 5.5 Version History
- **`GET /api/v1/content/:id/versions`**: Returns array of version snapshots (`v1`, `v2`, ...) with change types (`generated`, `refined`, `edited`).
- **`GET /api/v1/content/:id/versions/:versionId`**: Returns specific historical snapshot content.

---

## 6. Internal Service-to-Service Protocol (`ai-service`)

Protected communication between Express backend and FastAPI AI runtime:
- **Header**: `Authorization: Bearer <AI_SERVICE_TOKEN>`
- **Timing Protection**: Token validated via `secrets.compare_digest` in FastAPI.
- **Endpoints**:
  - `POST /internal/v1/generate`
  - `POST /internal/v1/refine`
  - `POST /internal/v1/variations`
