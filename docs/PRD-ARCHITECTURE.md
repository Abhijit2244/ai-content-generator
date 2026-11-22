# AI Content Generator - Product Requirements & Architecture

## 1. System Overview
The AI Content Generator is an enterprise-grade MVP designed to generate, refine, edit, version, save, and export written content powered by Google Gemini.

### Architecture Highlights
- **Modular Monolith Backend (Node.js + Express + TypeScript)**: Clean Architecture with Domain, Application Use Cases, Infrastructure Adapters, and Presentation Controllers.
- **Dedicated AI Service (Python + FastAPI)**: Isolates the LLM integration, prompt engineering strategies, output normalization, and Google GenAI SDK.
- **Frontend SPA (React 18 + Vite + TypeScript + Tailwind CSS)**: Feature-based architecture, TanStack Query for server state, React Hook Form + Zod for validation.
- **Persistence (SQLite + Prisma ORM)**: Local file-based relational database modeling Users, Content, ContentVersion, and GenerationLog.

```
                         ┌─────────────────────────┐
                         │       User / Browser    │
                         └────────────┬────────────┘
                                      │ HTTPS
                                      ▼
                         ┌─────────────────────────┐
                         │ React + TypeScript UI   │
                         │ Pages / Components      │
                         │ Forms / Query Client    │
                         └────────────┬────────────┘
                                      │ REST + JWT
                                      ▼
                         ┌─────────────────────────┐
                         │ Node.js + Express API   │
                         │                         │
                         │ Auth module             │
                         │ Content module          │
                         │ Generation orchestration│
                         │ Validation / Middleware │
                         └───────┬─────────┬───────┘
                                 │         │
                         Prisma  │         │ Internal REST
                                 │         │ + service auth
                                 ▼         ▼
                    ┌────────────────┐  ┌─────────────────────┐
                    │ SQLite         │  │ Python FastAPI      │
                    │                │  │ AI service          │
                    │ Users          │  │ Prompt templates    │
                    │ Content        │  │ Gemini adapter      │
                    │ Versions       │  │ Output validation   │
                    │ Generation log │  └──────────┬──────────┘
                    └────────────────┘             │
                                                   │ Gemini SDK
                                                   ▼
                                         ┌─────────────────────┐
                                         │ Google Gemini API   │
                                         └─────────────────────┘
```

## 2. Design Patterns Applied
1. **Clean Architecture / Ports & Adapters**: Application use cases depend only on domain entities and repository/client interfaces (ports). Database (Prisma) and AI client (HTTP/FastAPI) implement these ports.
2. **Controller-Service-Repository**: Request handling -> Use Case business logic orchestration -> Repository data access.
3. **Strategy Pattern for Prompts**: Distinct prompt template strategies for Blog posts, Social media posts, Emails, Marketing copy, Product descriptions, Study notes, Reports, and Creative writing.
4. **Adapter Pattern for AI Provider**: `AiServiceClient` decouples the Node backend from Gemini-specific details, while FastAPI encapsulates the Google GenAI SDK.
5. **Dependency Injection**: Dependencies are composed at application startup and injected into use cases for testability.

## 3. Database Schema (SQLite + Prisma)
- **User**: id (UUID), name, email (unique, lowercase), password_hash (bcrypt), created_at, updated_at.
- **Content**: id (UUID), user_id (FK User), title, content, content_type, tone, length, created_at, updated_at. Index on `(user_id, updated_at)`.
- **ContentVersion**: id (UUID), content_id (FK Content, CASCADE), version_number, content (snapshot), change_type (generated, refined, edited, selected), created_at. Unique on `(content_id, version_number)`.
- **GenerationLog**: id (UUID), user_id (FK User), content_id (nullable FK), operation, model_name, input_tokens, output_tokens, latency_ms, status, error_code, created_at.

## 4. Security Principles
- Gemini API key resides solely within the FastAPI private runtime.
- Client cannot specify user_id; all content operations verify ownership with authenticated user token.
- Passwords hashed with bcrypt.
- Input validated using Zod on Node.js and Pydantic on FastAPI.
- Service-to-service authentication between Node and FastAPI via secret bearer token (`AI_SERVICE_TOKEN`).
