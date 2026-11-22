# Learning & Interview Preparation Progress Tracker

> Use this interactive checklist to track your personal mastery of the technologies, architectures, security models, and design patterns implemented in the AI Content Generator project.

---

## Status Legend
- `[ ]` **Not Started**: Concept has not yet been reviewed.
- `[~]` **Documented**: Complete technical documentation, code references, and interview Q&As are documented in this folder.
- `[x]` **Practiced**: You have navigated the codebase, located the relevant functions, and modified or tested the behavior locally.
- `[✓]` **Understood**: You can confidently explain the technical concept, trade-offs, and design decisions in a technical interview without looking at notes.

---

## Module 1: System Architecture & Full-Stack Overview
- [~] Multi-tier polyglot architecture (React + Node.js + Python FastAPI + SQLite)
- [~] Clean separation of concerns between API I/O and AI orchestration
- [~] Service-to-service communication via internal HTTP and secret bearer tokens
- [~] Single-click startup and shutdown process automation (`start.ps1`, `stop.ps1`)
- [~] Distributed request correlation via `x-request-id` headers across services

---

## Module 2: React 18 & TypeScript Frontend
- [~] React 18 component lifecycle, Virtual DOM diffing, and reconciliation
- [~] State management with `useState` and controlled form inputs
- [~] Side-effect synchronization with `useEffect` and cleanup functions
- [~] Global authentication state management using React Context (`AuthContext.tsx`)
- [~] Client-side route guarding with higher-order components (`ProtectedRoute.tsx`)
- [~] High-performance uncontrolled form validation using `react-hook-form` + `zodResolver`
- [~] Dynamic 3-way layout switcher (Editor, Markdown View, Split View)
- [~] Custom `MarkdownViewer.tsx` AST rendering via `react-markdown` and `remark-gfm`
- [~] Client-side XSS defense: URL protocol sanitization (`sanitizeUrl`) and tabnabbing defense
- [~] Code block syntax styling with clipboard API feedback (`navigator.clipboard`)
- [~] Live derived state calculation for word count, character count, and reading time
- [~] URL state synchronization using React Router query parameters (`useSearchParams`)
- [~] Modal dialog accessibility and test scoping using `role="dialog"`

---

## Module 3: JavaScript & TypeScript Fundamentals
- [~] V8 engine architecture, call stack, memory heap, and libuv event loop
- [~] Strict equality (`===`) vs loose equality (`==`) and type coercion mechanics
- [~] JavaScript closures and lexical scope retention in middleware factories
- [~] Promises, microtask queue vs macrotask queue, and `async/await` mechanics
- [~] ES Modules (ESM) syntax, static analysis, tree-shaking, and `.js` import specifiers
- [~] TypeScript static typing, type inference, structural typing (duck typing), and nominal workarounds
- [~] Interfaces vs Type Aliases: declaration merging vs unions
- [~] TypeScript literal assertions (`as const`) and string literal unions
- [~] Schema-to-type reflection using Zod (`z.infer<typeof schema>`)
- [~] Safe property navigation: Optional chaining (`?.`) and Nullish coalescing (`??`)
- [~] Custom immutable error hierarchies subclassing native `Error` (`AppError`)
- [~] Network timeout orchestration using `AbortController` and `AbortSignal`

---

## Module 4: Node.js Runtime & Express API Architecture
- [~] Express application pipeline, router chaining, and middleware execution order
- [~] Custom middleware creation: request IDs, rate limiters, auth guards
- [~] Request payload body parsing with size bounding (`express.json({ limit: '1mb' })`)
- [~] Server technology fingerprinting mitigation (`app.disable('x-powered-by')`)
- [~] Centralized error handling using 4-argument Express error middleware (`err, req, res, next`)
- [~] Fail-fast environment configuration parsing via `dotenv` and `zod` (`env.ts`)
- [~] Standardized REST response envelopes for success and error states (`response.ts`)
- [~] HTTP Parameter Pollution (HPP) defense using Zod schema coercion
- [~] Server liveness probes (`/health`) and graceful process shutdown (`SIGTERM`/`SIGINT`)

---

## Module 5: Python 3, FastAPI, ASGI & Pydantic
- [~] Python asynchronous programming: `async`/`await`, coroutines, and `asyncio` event loop
- [~] ASGI (Asynchronous Server Gateway Interface) vs legacy WSGI architectures
- [~] Uvicorn server runtime, worker processes, and connection management
- [~] FastAPI dependency injection system via `Depends`
- [~] Pydantic `BaseModel` schema parsing, type coercion, and field constraint validation
- [~] Automatic OpenAPI (Swagger UI) documentation generation at `/docs`
- [~] Python string Enums (`str, Enum`) for bounded parameter validation
- [~] Constant-time string digest verification using `secrets.compare_digest`
- [~] FastAPI HTTP middleware for distributed request logging and header propagation
- [~] API secret redaction in Python error logs using regular expressions
- [~] Python packaging standards: `requirements.txt` vs `pyproject.toml`
- [~] Virtual environment isolation (`.venv`) and dependency management

---

## Module 6: LLM Fundamentals & Google Gemini Integration
- [~] Large Language Model architecture: Transformer decoder-only models, self-attention
- [~] Tokenization mechanics, token-to-word approximations, and context window limits
- [~] Inference latency metrics: Time to First Token (TTFT) and throughput (tokens/sec)
- [~] Model decoding parameters: Temperature, Top-P (nucleus sampling), Top-K
- [~] Model trade-offs: Frontier reasoning models (Pro) vs High-efficiency Flash models
- [~] Google GenAI SDK (`google-genai`) integration and client configuration
- [~] Multi-model fallback resilience (`gemini-2.5-flash` -> `gemini-3.5-flash` -> `gemini-3.5-flash-lite`)
- [~] Offline simulation and deterministic mocking for testing without API keys
- [~] Token consumption and cost calculation from usage metadata (`prompt_token_count`, `candidates_token_count`)
- [~] Model hallucination causes, grounding strategies, and factual constraint prompting

---

## Module 7: Prompt Engineering & Strategy Pattern Templates
- [~] Principles of prompt engineering: Clarity, context, constraints, examples, formatting
- [~] Zero-shot vs Few-shot prompting methodologies
- [~] Role and persona prompting for tone consistency
- [~] Strategy Pattern for prompts: `BasePromptTemplate` and concrete format subclasses
- [~] Dynamic structure guidelines adapting to content length (`short`, `medium`, `long`)
- [~] Output delimiter engineering for structured variation splitting (`===VARIATION_BREAK===`)
- [~] Negative constraints and anti-preamble prompt instructions
- [~] Prompt Injection (OWASP LLM01) mechanics: System overrides, jailbreaks, role hijacking
- [~] Structural XML tag boundary isolation (`<untrusted_reference_material>`, `<user_topic>`)
- [~] System guardrail reinforcement against command execution and credential disclosure

---

## Module 8: Relational Database Engineering: SQLite & Prisma ORM
- [~] Relational database fundamentals: Tables, rows, primary keys, foreign keys
- [~] SQLite embedded architecture: Single-file database, serverless, zero-config
- [~] SQLite Write-Ahead Logging (WAL) mode concurrency mechanics (readers don't block writers)
- [~] Prisma ORM schema design (`schema.prisma`): Models, relations, attributes, mappings
- [~] Cascading referential integrity (`onDelete: Cascade`, `onDelete: SetNull`)
- [~] Database indexing strategies: Composite index on `(userId, updatedAt)`
- [~] Unique multi-column constraints: `@@unique([contentId, versionNumber])`
- [~] Atomic multi-operation transactions via `prisma.$transaction()`
- [~] Offset pagination implementation (`skip`, `take`) and total count queries
- [~] Idempotent database seeding architecture: Preserving user records across restarts
- [~] Factual data enrichment: Pre-seeding empirical research benchmarks and citations

---

## Module 9: Authentication, Authorization & OWASP Security
- [~] Authentication (Identity) vs Authorization (Permissions)
- [~] Bcrypt cryptographic password hashing: Salting, work factors, resistance to rainbow tables
- [~] JSON Web Token (JWT) structure: Header, Payload, Signature
- [~] Cryptographic signature verification: Enforcing `algorithms: ['HS256']`
- [~] Timing side-channel attack mechanics: Measuring string comparison / bcrypt latency
- [~] Timing attack mitigation: Executing dummy constant-time bcrypt verification on missing users
- [~] Cross-Site Scripting (XSS): Stored, reflected, and DOM-based attack vectors
- [~] Input sanitization engine (`sanitizer.ts`): Regex stripping of scripts, iframes, and event handlers
- [~] HTTP Security Headers via Helmet: `X-Frame-Options`, `X-Content-Type-Options`, CSP
- [~] Multi-tier rate limiting: Auth endpoints, AI generation, and global API protection
- [~] Cross-Origin Resource Sharing (CORS): Whitelist configuration and browser preflight (`OPTIONS`)
- [~] Insecure Direct Object Reference (IDOR) prevention: Enforcing tenant scoping (`where: { id, userId }`)
- [~] Zero Secrets Policy: Keeping API keys isolated strictly in private service runtimes

---

## Module 10: Software Architecture & Design Patterns
- [~] Clean Architecture (Hexagonal / Ports & Adapters) principles and layer boundaries
- [~] Domain entities vs Database models: decoupling business logic from ORMs
- [~] Repository Pattern: Abstract interfaces (`IContentRepository`) and Prisma implementations
- [~] Adapter Pattern: Decoupling external services (`HttpAiServiceClient`, `GeminiClient`)
- [~] Strategy Pattern: Content-specific prompt generation (`BlogPromptTemplate`, `ReportPromptTemplate`)
- [~] Data Transfer Object (DTO) Pattern: Strict request/response boundary contracts
- [~] Dependency Injection: Composition root wiring in `createApp()`
- [~] Unit of Work Pattern: Coordinated atomic persistence in use cases
- [~] SOLID Principles applied across TypeScript and Python codebases

---

## Module 11: Testing Engineering & Quality Assurance (130 Tests)
- [~] Testing Pyramid: Balancing Unit, Integration, and End-to-End test suites
- [~] Database Isolation Guarantee: Running tests without altering or corrupting `dev.db`
- [~] In-memory test doubles: `InMemoryUserRepository` and `InMemoryContentRepository`
- [~] Ephemeral SQLite integration testing: Creating, migrating, and deleting temporary test databases
- [~] Vitest test runner: Configuration, execution, assertions, and mock functions (`vi.fn()`)
- [~] Supertest HTTP API testing without physical network socket binding
- [~] Pytest test runner: Configuration, fixtures, and async execution
- [~] Playwright Chromium E2E testing: Browser automation, locators, page routing, and mocks
- [~] Playwright locator strict mode resolution and modal dialog scoping (`getByRole('dialog')`)
- [~] Unified single-command test reporter (`test-reporter.mjs` / `npm run test:report`)
- [~] Automated verification of timing attack defenses, XSS sanitization, and security headers

---

## Module 12: GenAI Evolution: RAG, Agents & MCP
- [~] Retrieval-Augmented Generation (RAG) architecture and semantic grounding
- [~] Vector embeddings: Mapping textual semantics to high-dimensional mathematical vectors
- [~] Vector similarity metrics: Cosine similarity, dot product, Euclidean distance
- [~] Document chunking strategies: Fixed-size, sentence-aware, and semantic splitting
- [~] Vector database indexing: HNSW (Hierarchical Navigable Small World) graphs
- [~] Extending SQLite with vector capabilities using `sqlite-vss`
- [~] AI Agents: Perception, reasoning, action loops (ReAct framework)
- [~] Tool Calling (Function Calling): Equipping LLMs with structured execution tools
- [~] Multi-Agent Orchestration using LangGraph: State graphs, nodes, and conditional edges
- [~] Model Context Protocol (MCP): Open standard for universal AI assistant integration
