# AI Content Generator - Product Requirements & Architecture

Comprehensive technical architecture, design patterns, security model, and testing blueprint for the AI Content Generator platform.

---

## 1. System Overview

The AI Content Generator is an enterprise-grade content creation and editing platform built with a modular architecture pairing **Node.js (Clean Architecture)** with a dedicated **Python AI Service (Strategy Pattern)** and a **React 18 SPA (Feature-Driven)**.

### Architectural Blueprint

```
                              ┌────────────────────────────────────────┐
                              │            Client Browser              │
                              │  React 18 + Vite + Tailwind CSS        │
                              │                                        │
                              │  ┌──────────────────────────────────┐  │
                              │  │   Markdown Viewer & Split View   │  │
                              │  │   (react-markdown + remark-gfm)  │  │
                              │  └──────────────────────────────────┘  │
                              └───────────────────┬────────────────────┘
                                                  │ HTTPS / JWT Bearer
                                                  │ Helmet / CSP / CORS
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │     Node.js + Express (Port 5000)      │
                              │     Modular Monolith / Clean Arch      │
                              │                                        │
                              │  ┌──────────────┐   ┌───────────────┐  │
                              │  │ Auth Module  │   │Content Module │  │
                              │  │ Bcrypt / JWT │   │CRUD / Version │  │
                              │  └──────────────┘   └───────┬───────┘  │
                              │                             │          │
                              │              ┌──────────────┴───────┐  │
                              │              │Generation Module     │  │
                              │              │Orchestration & Logs  │  │
                              │              └──────────────┬───────┘  │
                              └──────────────┬──────────────┼──────────┘
                                             │              │
                   Prisma ORM (Strict Tenant)│              │ Internal HTTP + Token
                   where: { id, userId }     │              │ secrets.compare_digest
                                             ▼              ▼
                              ┌────────────────┐  ┌────────────────────┐
                              │ SQLite (dev.db)│  │ FastAPI (Port 8000)│
                              │ - Users        │  │ - Prompt Strategies│
                              │ - Contents     │  │ - Refinement Engine│
                              │ - Versions     │  │ - Injection Shield │
                              │ - GenLogs      │  │ - Gemini Client    │
                              └────────────────┘  └─────────┬──────────┘
                                                            │ Google GenAI SDK
                                                            │ Auto-fallback models
                                                            ▼
                                                  ┌────────────────────┐
                                                  │ Google Gemini API  │
                                                  │ (Flash / Pro)      │
                                                  └────────────────────┘
```

---

## 2. Core Architectural Patterns

### 2.1 Clean Architecture / Hexagonal Architecture (Backend)
The Node.js backend adheres strictly to Clean Architecture separation:
- **Domain Layer**: Pure business entities (`User`, `Content`, `ContentVersion`, `GenerationLog`) and repository interfaces. No third-party or ORM dependencies.
- **Application Layer**: Use case orchestrators (`GenerateContentUseCase`, `RefineContentUseCase`, `RegisterUserUseCase`, `LoginUserUseCase`, `UpdateContentUseCase`).
- **Infrastructure Layer**: Concrete adapters implementing domain ports (`PrismaContentRepository`, `BcryptPasswordHasher`, `JwtTokenService`, `HttpAiServiceClient`).
- **Presentation Layer**: Express controllers, routes, and Zod DTO validation schemas.

### 2.2 Strategy Pattern (AI Prompt Templates)
In the Python FastAPI service, every content type format is encapsulated into a dedicated Strategy subclass (`BlogPromptTemplate`, `SocialPromptTemplate`, `ReportPromptTemplate`, etc.) inheriting from `BasePromptTemplate`:
- Defines specialized structure guidelines per target length (short, medium, long).
- Injects format-specific stylistic and typographical rules.
- Isolates untrusted user reference material inside demarcated blocks.

### 2.3 Adapter Pattern (AI Service Client)
The Node.js `IAiServiceClient` interface abstracts all LLM communication. The backend has zero direct dependency on Google Gemini APIs; it communicates with the FastAPI service via authenticated REST protocols, enabling transparent provider swapping or local offline mocking.

---

## 3. Dedicated Markdown Viewer & Split View Architecture

The frontend workspace provides a flexible 3-way viewing paradigm built on `react-markdown` and `remark-gfm`:
- **Editor Mode**: Focused textarea writing environment with live word and character counters.
- **Markdown View**: Rendered formatted preview with styled headings (H1–H4), tables, bullet lists, blockquotes, inline code, and syntax code blocks with copy-to-clipboard functionality.
- **Split View**: Synchronized two-column layout: raw source editing on the left and live rendered markdown on the right.
- **Library Quick Modal Preview**: Direct formatted preview from the Content Library without opening the editor.

---

## 4. Threat Model & Security Architecture (OWASP Aligned)

| Threat | Attack Surface | Mitigation Implemented |
| :--- | :--- | :--- |
| **Cross-Site Scripting (XSS)** | Document titles, body text, notes, and AI responses | Server-side sanitizer strips `<script>`, `<iframe>`, `<object>`, inline event handlers (`onerror=`, `onload=`), and null bytes (`\0`). `MarkdownViewer` neutralizes `javascript:` links and enforces `rel="noopener noreferrer"`. |
| **Timing Side-Channel Attacks** | Login endpoint email enumeration | Constant-time dummy bcrypt verification executed when an email is not found, ensuring identical response times for registered and unregistered accounts. |
| **Clickjacking & UI Redressing** | Embedding application in malicious iframes | Helmet sets `X-Frame-Options: SAMEORIGIN` and strict `Content-Security-Policy`. |
| **MIME Sniffing & Fingerprinting** | MIME confusion, Express header leakage | Helmet sets `X-Content-Type-Options: nosniff`. Express `X-Powered-By` header is suppressed. Error handler strips stack traces in non-development modes. |
| **CORS Exploitation** | Cross-origin request forgery | Explicit origin whitelist (`localhost:5173`). FastAPI AI service CORS restricted to internal backend callers. |
| **Brute-Force & Credential Stuffing** | Login and Registration endpoints | Rate-limited to max 30 attempts per 15-minute window per IP. Passwords require min 8 chars, 1 uppercase, 1 digit. |
| **Denial of Service (DoS)** | Unbounded request flooding, memory exhaustion | Multi-tier rate limiting (150 req/min global, 20 req/min AI), 1MB payload limits, and pagination query limits (`limit <= 50`). |
| **Insecure Direct Object Reference (IDOR)** | Multi-tenant content manipulation | Every database query enforces strict owner scoping (`where: { id, userId }`). |
| **Prompt Injection & Jailbreaks (OWASP LLM01)** | User inputs attempting system prompt overrides | Prompts enforce XML structural delimiters (`<untrusted_reference_material>`, `<user_topic>`) and explicit system directives forbidding command overrides, role changes (DAN mode), and credential disclosure. |
| **Secret & Key Exposure** | API key leakage in logs or responses | Zero Secrets Policy: `GEMINI_API_KEY` resides strictly in `ai-service/.env`. `GeminiClient` automatically redacts `AIza...` key patterns from error messages and logs. |

---

## 5. Database Persistence & Idempotent Seeding Architecture

The relational SQLite schema (`backend/prisma/schema.prisma`):
- **User**: id (UUID), name, email (unique, lowercase), passwordHash (bcrypt), createdAt, updatedAt.
- **Content**: id (UUID), userId (FK User), title, content, contentType, tone, length, createdAt, updatedAt. Index on `(userId, updatedAt)`.
- **ContentVersion**: id (UUID), contentId (FK Content, CASCADE), versionNumber, contentSnapshot, changeType (`generated`, `refined`, `edited`), createdAt. Unique on `(contentId, versionNumber)`.
- **GenerationLog**: id (UUID), userId (FK User), contentId (nullable FK), operation, modelName, inputTokens, outputTokens, latencyMs, status, errorCode, createdAt.

### Idempotent Seeding Design
On application startup, the seeding engine checks if existing user records exist. If records are detected, the seed step skips automatically, ensuring user data, document edits, and newly registered accounts are **never overwritten or reset** across server restarts.

---

## 6. Testing & Quality Assurance Architecture (130 Tests)

A unified test runner (`test-reporter.mjs` / `npm run test:report`) executes all test suites under strict database isolation:
- **77 Backend Tests (Vitest)**:
  - Unit tests with in-memory repositories and mock hashing/token services.
  - Ephemeral SQLite integration tests running against temporary disposable test databases.
  - Dedicated security tests validating XSS sanitization, timing attack mitigation, JWT security, Helmet headers, and CORS policies.
- **33 AI Service Tests (Pytest)**:
  - Pydantic schema validation and boundary checks.
  - Prompt template strategy formatting and XML boundary isolation.
  - Constant-time service token verification and prompt injection guardrails.
  - Secret redaction verification.
- **20 Frontend End-to-End Tests (Playwright Chromium)**:
  - Full authentication lifecycle (Register, Login, Sign out, Route guards).
  - Generator workspace generation, refinement, and variation workflows.
  - Live character/word count and 3-way view switcher (Editor, Markdown, Split).
  - Content library search, filtering, rename, delete modals, and quick preview.
  - Client-side XSS link neutralization verification.
- **Database Isolation Guarantee**: Production database (`backend/prisma/dev.db`) remains completely untouched during all test runs.
