# Architectural Decision Records (ADRs)

> Comprehensive technical records documenting the architectural decisions, trade-offs, rationale, and evolution paths of the AI Content Generator platform.

---

## Index of Architectural Decisions

- [ADR-01: Multi-Tier Polyglot Service Separation (Node.js + Python FastAPI + React)](#adr-01-multi-tier-polyglot-service-separation) — **[Implemented]**
- [ADR-02: Clean Architecture / Hexagonal Ports & Adapters in Node.js Backend](#adr-02-clean-architecture-in-nodejs-backend) — **[Implemented]**
- [ADR-03: Strategy Pattern for Content-Type Specific Prompt Orchestration](#adr-03-strategy-pattern-for-prompt-orchestration) — **[Implemented]**
- [ADR-04: SQLite with Write-Ahead Logging (WAL) via Prisma ORM](#adr-04-sqlite-with-wal-mode-via-prisma-orm) — **[Implemented]**
- [ADR-05: Stateless JWT Authentication with Constant-Time Timing Protection](#adr-05-stateless-jwt-authentication-with-timing-protection) — **[Implemented]**
- [ADR-06: Dedicated Client-Side Markdown Viewer with Protocol Sanitization](#adr-06-dedicated-markdown-viewer-with-protocol-sanitization) — **[Implemented]**
- [ADR-07: Defense-in-Depth Security (OWASP Top 10 Aligned)](#adr-07-defense-in-depth-security-architecture) — **[Implemented]**
- [ADR-08: Complete Database Isolation in Automated Testing](#adr-08-complete-database-isolation-in-testing) — **[Implemented]**
- [ADR-09: Synchronous REST Request-Response vs. Streaming SSE / WebSockets](#adr-09-synchronous-rest-vs-streaming-sse) — **[Implemented / Future Path Defined]**
- [ADR-10: Asynchronous Task Queues & Vector RAG Ingestion Pipeline](#adr-10-asynchronous-task-queues--vector-rag-pipeline) — **[Conceptual Only]**

---

### ADR-01: Multi-Tier Polyglot Service Separation

- **Status**: **[Implemented]**
- **Context**: The application requires high-performance web routing, multi-tenant persistence, relational data modeling, and cutting-edge GenAI orchestration using Google Gemini models.
- **Decision Made**: Decouple the system into three distinct runtime layers:
  1. Frontend SPA in React 18 / Vite / TypeScript (Port 5173).
  2. Core Backend in Node.js / Express / TypeScript / Prisma (Port 5000).
  3. AI Microservice in Python 3 / FastAPI / Google GenAI SDK (Port 8000).
- **Reason**:
  - Python is the de facto primary ecosystem for AI, LLM SDKs, LangChain, embeddings, and vector tools.
  - Node.js excels at high-throughput I/O, relational business logic, JSON processing, and rapid full-stack TypeScript developer velocity.
  - Isolating the LLM integration in an internal microservice ensures the Google Gemini API key is never exposed to the browser or the public API server.
- **Alternatives Considered**:
  - *Full-Stack Node.js Monolith*: Calling Gemini directly from Node using `@google/genai`. Rejected because future AI extensions (RAG, PyTorch embeddings, LangGraph, local Python SLMs) would be severely constrained in Node.
  - *Full-Stack Python Monolith (Django/FastAPI + Jinja/React)*: Rejected due to heavier boilerplate, slower relational ORM workflows compared to Prisma, and less fluid full-stack TypeScript typing.
- **Advantages**:
  - Independent scaling: AI inference can scale out on GPU/CPU workers without scaling the web API.
  - Strict secret isolation: API keys are sequestered inside the private Python network layer.
  - Polyglot flexibility: Teams can write AI logic in Python and web features in TypeScript.
- **Limitations**:
  - Local operational complexity: Requires running two backend processes (Node and Uvicorn).
  - Network hop overhead: Adds ~5–15ms of internal HTTP latency between Node and Python.
- **When a Different Approach Might Be Better**: For a tiny personal hackathon project, a single Next.js or Express monolith calling Gemini directly would eliminate multi-process orchestration.

---

### ADR-02: Clean Architecture in Node.js Backend

- **Status**: **[Implemented]**
- **Context**: Backend applications often devolve into "Smart Controllers" where business rules, database queries, and third-party API calls are tangled together, making testing and maintenance difficult.
- **Decision Made**: Organize `backend/src/modules/` into Clean Architecture layers:
  - **Domain**: Pure entity models and repository interfaces (`user.ts`, `content.ts`, `generation.ts`). No Prisma or Express imports.
  - **Application**: Pure use case interactors (`generate-content.ts`, `refine-content.ts`, `login-user.ts`).
  - **Infrastructure**: Concrete adapters implementing domain interfaces (`prisma-content-repository.ts`, `bcrypt-hasher.ts`, `http-ai-service-client.ts`).
  - **Presentation**: Express controllers, routes, and Zod DTO schemas (`content-controller.ts`, `content-routes.ts`).
- **Reason**: Decouples business logic from frameworks and external libraries. Allows testing use cases in pure unit tests with in-memory data structures without creating database connections.
- **Alternatives Considered**:
  - *Active Record / Classic MVC*: Embedding queries inside models or controllers. Faster to scaffold initially, but produces brittle code that cannot be tested without a live database.
  - *NestJS Framework*: Provides built-in Clean Architecture conventions, but introduces heavy decorators, reflection metadata, and steep learning curves.
- **Advantages**:
  - High testability: Use cases can be verified using mock objects in milliseconds.
  - Framework independence: Express could be replaced with Fastify with zero changes to use cases.
  - ORM independence: Prisma could be replaced with TypeORM or Kysely without changing domain rules.
- **Limitations**:
  - Higher initial file count: Requires separate files for use case, interface, repository, controller, and DTO.
- **When a Different Approach Might Be Better**: For microservices with only 1–2 simple CRUD endpoints, standard flat Express routing is faster to build.

---

### ADR-03: Strategy Pattern for Prompt Orchestration

- **Status**: **[Implemented]**
- **Context**: Different content formats (Blog, Email, Social, Report, Product Description) require wildly different formatting rules, structural hierarchies, and length guidelines. A single giant prompt string creates severe prompt drift and maintenance headaches.
- **Decision Made**: Implement the **Strategy Pattern** in Python (`ai-service/app/prompts/templates/`):
  - Base interface: `BasePromptTemplate` declaring `get_structure_guidelines(length)` and `get_formatting_rules()`.
  - Concrete strategies: `BlogPromptTemplate`, `SocialPromptTemplate`, `EmailPromptTemplate`, `ReportPromptTemplate`, etc.
  - Central registry: `STRATEGY_MAP` in `templates/__init__.py` resolving strategies dynamically via $O(1)$ dictionary lookup.
- **Reason**: Satisfies the **Open/Closed Principle (OCP)**: New content formats (e.g., Video Scripts, Press Releases) can be added simply by creating a new template class without touching existing code.
- **Alternatives Considered**:
  - *Conditional If/Else Statements inside a single function*: Hard to maintain, prone to accidental regressions when modifying one content type.
  - *External Jinja2 Template Files*: Provides clean separation, but lacks strongly typed validation and dynamic length-dependent logic.
- **Advantages**:
  - Modular, isolated prompt testing per format.
  - Clear structural enforcement (e.g. Markdown tables in reports, hashtags in social posts).
  - Clean separation between structural formatting and untrusted user reference inputs.
- **Limitations**:
  - Requires maintaining multiple Python class files.
- **When a Different Approach Might Be Better**: If prompts were dynamic and editable by end-users at runtime, storing prompts in a database with Jinja/Mustache variables would be required.

---

### ADR-04: SQLite with WAL Mode via Prisma ORM

- **Status**: **[Implemented]**
- **Context**: The educational MVP requires relational data modeling (Users, Documents, Version Snapshots, Generation Logs) that runs frictionlessly on any developer's machine without installing heavy external database servers (like PostgreSQL or Docker).
- **Decision Made**: Use **SQLite** via **Prisma ORM** with Write-Ahead Logging (WAL) enabled (`backend/prisma/dev.db`).
- **Reason**:
  - Zero-configuration: A single file on disk; no database daemon, ports, or credentials to configure.
  - High performance: In WAL mode, SQLite executes over 64,000 read queries/sec with sub-millisecond latencies, as readers do not block writers.
  - Prisma portability: Prisma abstracts SQL dialects. Migrating to PostgreSQL or MySQL requires changing only one line in `schema.prisma` (`provider = "postgresql"`).
- **Alternatives Considered**:
  - *PostgreSQL in Docker*: Industry standard for production, but creates heavy setup friction for students, IT graduates, and local evaluation.
  - *MongoDB / Mongoose*: Schema-less document store. Lacks native referential integrity and cascading deletes for version snapshots.
- **Advantages**:
  - Frictionless local setup: Works instantly upon cloning.
  - ACID compliant: Supports multi-table transactions (`prisma.$transaction`).
  - Strong typing: Prisma client generates fully typed TypeScript models.
- **Limitations**:
  - Concurrency write ceiling: SQLite permits only one writer at a time. High concurrent write throughput will encounter `SQLITE_BUSY`.
  - Single-node only: SQLite cannot be shared natively across multiple distributed container instances without specialized tools (like LiteFS).
- **When a Different Approach Might Be Better**: When deploying multi-replica production services to Kubernetes or AWS ECS with hundreds of concurrent writers, PostgreSQL is strictly required.

---

### ADR-05: Stateless JWT Authentication with Timing Protection

- **Status**: **[Implemented]**
- **Context**: The API requires secure, multi-tenant user authentication across stateless REST endpoints while defending against credential stuffing and user enumeration attacks.
- **Decision Made**:
  - **Stateless JWTs**: Signed with `HS256` secret, containing `id`, `email`, and `name` with a 24-hour expiration TTL.
  - **Bcrypt Password Hashing**: Passwords hashed with 10 salt rounds before persistence.
  - **Timing Attack Mitigation**: When login fails due to an unregistered email, execute a constant-time dummy bcrypt comparison using a precomputed hash to neutralize response timing deltas.
- **Reason**:
  - Stateless JWTs eliminate server-side session stores (Redis) for the educational MVP.
  - Constant-time verification prevents attackers from measuring server response latencies to discover which emails are registered.
- **Alternatives Considered**:
  - *Stateful Server Sessions (Express-Session + Redis)*: Highly secure and easily revocable, but introduces external Redis infrastructure dependencies.
  - *Third-Party Auth (Auth0 / Firebase / Supabase)*: High setup overhead, external cloud dependencies, and potential subscription costs.
- **Advantages**:
  - Zero session storage overhead on the server.
  - Cryptographically tamper-proof claims verified via `jwt.verify`.
  - Complete defense against email enumeration timing attacks.
- **Limitations**:
  - Immediate token revocation (blacklisting) is non-trivial without maintaining a token revocation list in memory or Redis.
  - Storing tokens in client `localStorage` carries theoretical XSS exposure risks (mitigated by strict Markdown link and input sanitization).
- **When a Different Approach Might Be Better**: In high-security banking or healthcare applications, `httpOnly` `SameSite=Strict` session cookies combined with short-lived tokens and Redis revocation lists are mandatory.

---

### ADR-06: Dedicated Markdown Viewer with Protocol Sanitization

- **Status**: **[Implemented]**
- **Context**: Generated content is rich structured text (headings, bullet points, tables, quotes, code blocks). Displaying raw text in a `<textarea>` alone degrades readability, while naive HTML rendering invites stored XSS attacks.
- **Decision Made**:
  - Build a custom `MarkdownViewer.tsx` component using `react-markdown` and `remark-gfm`.
  - Provide a 3-way view toggle in the Generator workspace: **Editor**, **Markdown View**, and **Split View**.
  - Provide a **Quick Markdown Preview Modal** in the Content Library.
  - Sanitize all link and image URLs using `sanitizeUrl()` to block `javascript:`, `data:`, and `vbscript:` pseudo-protocols.
- **Reason**:
  - Delivers an intuitive editorial experience matching tools like Notion and ChatGPT.
  - `react-markdown` compiles Markdown into an Abstract Syntax Tree (AST) rather than inserting raw HTML, preventing XSS injection while supporting GitHub Flavored Markdown (tables, task lists).
- **Alternatives Considered**:
  - *Raw Textarea Only*: Zero XSS risk, but poor user experience for formatted tables, quotes, and code blocks.
  - *Wysiwyg Rich Text Editor (Draft.js, Quill, TipTap)*: Rich editing, but introduces complex JSON document schema state management and bloats frontend bundle size.
- **Advantages**:
  - Clean separation between raw Markdown editing and formatted reading.
  - Dark syntax code blocks with one-click copy buttons.
  - Robust XSS neutralization.
- **Limitations**:
  - Split view requires adequate screen width (best experienced on tablet/desktop viewports).
- **When a Different Approach Might Be Better**: If the application required inline collaborative rich-text co-authoring (like Google Docs), TipTap or ProseMirror with CRDTs (Yjs) would be preferred.

---

### ADR-07: Defense-in-Depth Security Architecture

- **Status**: **[Implemented]**
- **Context**: Web and GenAI applications are vulnerable to diverse attack vectors: XSS, Clickjacking, MIME sniffing, brute-force credential stuffing, CORS bypasses, and Prompt Injection (OWASP Top 10 + OWASP LLM Top 10).
- **Decision Made**: Implement multi-tier defense-in-depth across all three layers:
  1. **Transport & HTTP**: Helmet headers (`nosniff`, `SAMEORIGIN`), strict CORS origin whitelisting, Express `x-powered-by` suppression.
  2. **Rate Limiting**: Multi-tier in-memory rate limiting (30 req/15 min on auth, 20 req/1 min on AI generation, 150 req/1 min global).
  3. **Input & Output Sanitization**: Regex sanitizer stripping script tags, event handlers (`onerror=`), and null bytes (`\0`) on inputs and AI outputs.
  4. **AI Prompt Guardrails**: Strict XML structural delimiters and system instructions forbidding prompt overrides and secret disclosure.
  5. **Secret Redaction**: Regex scrubbing of `AIza...` Google API keys from error messages and logs.
- **Reason**: Security must be applied at every layer (Defense-in-Depth) rather than relying solely on perimeter firewalls or client validation.
- **Alternatives Considered**:
  - *Relying only on Zod validation*: Zod validates string length, but does not sanitize embedded HTML script tags or event handlers.
- **Advantages**:
  - Comprehensive protection against OWASP Top 10 vulnerabilities.
  - Protects against indirect prompt injection where an LLM is coerced into outputting attack payloads.
- **Limitations**:
  - In-memory rate limiting resets on process restart and does not synchronize across multi-server clusters (addressed in ADR-10).
- **When a Different Approach Might Be Better**: In high-traffic enterprise environments, deploying a Web Application Firewall (WAF) like Cloudflare or AWS WAF provides edge-level mitigation before requests hit origin servers.

---

### ADR-08: Complete Database Isolation in Testing

- **Status**: **[Implemented]**
- **Context**: Automated test suites often contaminate or overwrite local development data, corrupting developer records and causing flaky test failures.
- **Decision Made**: Enforce strict three-tier test isolation:
  1. **Backend Unit Tests (Vitest)**: Run against pure in-memory repository doubles (`InMemoryUserRepository`, `InMemoryContentRepository`). Zero database connections.
  2. **Backend API Integration Tests (Vitest + Supertest)**: Spin up an ephemeral, temporary SQLite file (`test-isolated.db`), push schema, run tests, and delete the file upon completion.
  3. **Frontend E2E Tests (Playwright Chromium)**: Intercept all network traffic via `page.route()`, returning mock JSON payloads without executing write operations against the backend database.
- **Reason**: Guarantees that running `npm run test:report` will **never alter, overwrite, or corrupt the local development database (`dev.db`)**.
- **Alternatives Considered**:
  - *Testing against active dev.db*: High risk of data loss and flaky test state collisions.
  - *Mocking Prisma client entirely in integration tests*: Bypasses real SQL constraint verification, foreign key cascades, and unique index checks.
- **Advantages**:
  - 100% deterministic, repeatable test runs.
  - Tests can run concurrently without race conditions.
  - Development data remains permanently intact.
- **Limitations**:
  - Creating and pushing schema to an ephemeral SQLite database in integration tests adds ~3 seconds to test startup.
- **When a Different Approach Might Be Better**: When testing against complex database features (like PostgreSQL stored procedures or pgvector), dedicated Dockerized test containers (Testcontainers) are preferred.

---

### ADR-09: Synchronous REST vs. Streaming SSE for AI Generation

- **Status**: **[Implemented: Synchronous REST / Evolution Path Defined: SSE]**
- **Context**: Content generation takes between 1.5 and 5 seconds depending on model latency and output length.
- **Decision Made**:
  - **Currently Implemented**: Synchronous REST request-response. The client issues a `POST` request, holds the connection open, awaits the complete generation, and receives a JSON envelope containing the full markdown text and token usage metadata.
  - **Evolution Path Defined**: Server-Sent Events (SSE) streaming tokens progressively to the client for a typewriter effect.
- **Reason for Current Implementation**:
  - Simplicity and reliability: Standard JSON envelopes allow clean atomic database transactions (`prisma.$transaction`) saving content, initial version snapshots, and generation logs together.
  - Complete token metadata: Full usage metadata (`inputTokens`, `outputTokens`) is provided synchronously by Gemini upon completion.
- **Alternatives Considered**:
  - *Full WebSockets*: Bidirectional full-duplex communication. Unnecessary overhead for unidirectional token streaming.
- **Advantages of Current Decision**:
  - Standard REST error handling (HTTP 400, 401, 429, 502).
  - Trivial to test and mock in unit and integration test suites.
- **Limitations**:
  - User waits 2–4 seconds looking at a spinner before reading content.
- **When a Different Approach Might Be Better**: For long-form documents (>1,500 words) where generation exceeds 8 seconds, streaming tokens via SSE is critical for perceived user performance.

---

### ADR-10: Asynchronous Task Queues & Vector RAG Pipeline

- **Status**: **[Conceptual Only]**
- **Context**: Future enterprise evolution will require processing massive batch generations, generating hundreds of document variations simultaneously, and grounding AI generation in proprietary corporate knowledge bases.
- **Conceptual Blueprint**:
  1. **Task Queue Architecture**:
     - Introduce **BullMQ** on **Redis** in the Node.js backend.
     - Content generation requests return HTTP 202 Accepted with a `jobId`.
     - Background worker processes consume generation jobs, manage retries with exponential backoff, and push progress via WebSockets/SSE.
  2. **Retrieval-Augmented Generation (RAG) Architecture**:
     - Ingest corporate PDFs and documentation.
     - Chunk text using semantic splitters into 500-token passages.
     - Generate vector embeddings using Google's `text-embedding-004`.
     - Store and index vectors using SQLite vector extension (`sqlite-vss`) or ChromaDB.
     - On user prompt, query nearest neighbors via cosine similarity and inject relevant passages into the prompt's `<untrusted_reference_material>` block.
- **When to Implement**: When user concurrency exceeds 50 concurrent generation requests, or when users require answering questions grounded in private multi-megabyte document libraries.
