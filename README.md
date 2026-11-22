# AI Content Generator (Enterprise Grade)

A full-stack, enterprise-grade AI Content Generation & Editing Studio built with **React**, **Node.js/Express**, **Python/FastAPI**, **SQLite**, **Prisma**, and **Google Gemini**.

---

## 🌟 Key Features

### 1. Multi-Format AI Generation
- **Supported Formats**:
  - Blog Posts & Deep Dives
  - Social Media Posts (LinkedIn, Instagram, X/Twitter)
  - Executive & Professional Emails
  - Marketing Copy & High-Conversion Advertisements
  - Product Descriptions & E-Commerce Listings
  - Study Notes & Educational Summaries
  - Formal Executive Reports & Shareholder Briefings
  - Creative Writing, Storytelling & Scripts
- **Customization Controls**:
  - **Tones**: Professional, Casual, Friendly, Persuasive, Informative, Creative, Humorous, Academic
  - **Lengths**: Short (~100–200 words), Medium (~300–500 words), Long (~700–1000 words)
  - **Target Audience**, **Keywords**, **Contextual Directives**, and **Source Reference Material**

### 2. Dedicated Markdown Viewer & Split-View Workspace
- **3-Way View Switcher**:
  - **Editor**: Raw markdown textarea editing with live dynamic word and character counters.
  - **Markdown View**: Rendered formatted document with styled headings, blockquotes, bullet lists, and tables.
  - **Split View**: Side-by-side editing on the left and real-time rendered markdown on the right.
- **Syntax Highlighting & Code Blocks**: Code blocks with dark theme styling, language identification, and one-click copy buttons.
- **Quick Markdown Modal**: Browse and read formatted documents directly from the Saved Library without leaving the view.

### 3. Interactive In-Editor Refinement & Variations
- **One-Click Refinements**: *Rewrite*, *Improve Grammar*, *Simplify*, *Expand*, *Shorten*, *Change Tone*, *Improve Readability*.
- **Partial Excerpt Refinement**: Highlight a specific paragraph to refine it in-place while preserving surrounding context.
- **Alternative Variations**: Generate up to 3 distinct creative alternatives simultaneously.

### 4. Version History & Snapshots
- Automatic immutable snapshot creation upon generation, refinement, and manual edits.
- Browse chronological version snapshots (`v1`, `v2`, `v3`) with change-type tags (`generated`, `refined`, `edited`).

### 5. Content Management & Export
- Real-time search across titles and body text with content-type filtering and sorting.
- Rename, delete, and manage documents with modal confirmation guards.
- One-click copy to clipboard, export to plain text (`.txt`), and export to Markdown (`.md`).

### 6. Defense-in-Depth Security (OWASP Top 10 Aligned)
- **Input & Output XSS Sanitization**: Strips `<script>`, `<iframe>`, `<object>`, inline event handlers (`onerror=`, `onload=`), `javascript:`, and null bytes (`\0`).
- **Client-Side Link Protection**: Neutralizes `javascript:` and unsafe pseudo-protocols in Markdown links and images; enforces `rel="noopener noreferrer"`.
- **Timing Side-Channel Protection**: Performs constant-time dummy bcrypt comparisons during login to prevent attacker email enumeration.
- **HTTP Security Headers**: Powered by `helmet` with `X-Frame-Options: SAMEORIGIN` (clickjacking defense), `X-Content-Type-Options: nosniff`, CSP, and `X-Powered-By` suppression.
- **CORS Whitelist**: Explicitly restricted to authorized frontend origins.
- **Multi-Tier Rate Limiting**: Dedicated limiters on auth (30 req / 15 min), AI generation (20 req / 1 min), and global API (150 req / 1 min).
- **Prompt Injection & LLM Jailbreak Guardrails**: Structural XML isolation (`<untrusted_reference_material>`, `<user_topic>`) with system directives prohibiting command overrides and credential disclosure.
- **Secret Redaction**: Automatic redaction of `AIza...` API keys from all error logs and exception messages.

### 7. Unified 130-Test Suite & Database Isolation
- **130 / 130 Tests Passing (100%)**:
  - 77 Backend Unit & Integration Tests (Vitest)
  - 33 AI Service Tests (Pytest)
  - 20 End-to-End User Flow Tests (Playwright Chromium)
- **Zero Database Tampering Guarantee**: Tests run strictly against in-memory stores and ephemeral isolated databases; production database (`dev.db`) remains completely untouched.

---

## 🏗️ Architecture

```
ai-content-generator/
├── frontend/               # React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons
│   ├── src/components/     # MarkdownViewer, Navbar, Layout
│   ├── src/features/       # Generator, History, Dashboard, Auth, Landing, Profile
│   └── e2e/                # Playwright Chromium E2E specs
├── backend/                # Node.js + Express + Prisma + SQLite (Clean Architecture)
│   ├── src/modules/        # Auth, Content, Generation (Domain, Application, Infrastructure, Presentation)
│   ├── src/shared/         # Sanitizer, Rate Limiters, JWT, Errors, Middleware
│   ├── prisma/             # Schema, migrations, and idempotent seed scripts
│   └── tests/              # Unit, integration, and security test suites
├── ai-service/             # Python + FastAPI + Google GenAI SDK (Strategy Pattern)
│   ├── app/prompts/        # Strategy-pattern prompt templates & refinement builders
│   ├── app/infrastructure/ # Gemini client with fallback flash models & secret redaction
│   └── tests/              # Pytest endpoint, prompt, and security tests
├── docs/                   # Architectural blueprints & specifications
│   ├── PRD-ARCHITECTURE.md
│   ├── API-CONTRACTS.md
│   └── DEVELOPMENT.md
├── test-reporter.mjs       # Unified single-command test runner (130 tests)
├── start.ps1 / start.bat   # One-click start scripts
└── stop.ps1 / stop.bat     # One-click stop scripts
```

---

## 🚀 Getting Started

### One-Click Start & Stop Scripts

#### Windows (PowerShell / Command Prompt)
- **To Start:** Double-click `start.bat` or run:
  ```powershell
  .\start.ps1
  ```
- **To Stop:** Double-click `stop.bat` or run:
  ```powershell
  .\stop.ps1
  ```

#### Cross-Platform / Linux / macOS / Git Bash
- **To Start:** `./start.sh`
- **To Stop:** `./stop.sh`

#### Via npm
```bash
npm start   # Launches all 3 services
npm stop    # Stops all services and frees ports
```

Once started:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **AI Service OpenAPI Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 👤 Pre-Seeded Accounts & Factual Data

The local SQLite database includes pre-seeded demo accounts loaded with **factual research reports, empirical benchmarks, and citations** (persisted idempotently across restarts):

| User | Email | Password | Pre-loaded Factual Content |
| :--- | :--- | :--- | :--- |
| **Alex Mercer** | `demo@example.com` | `Password123!` | Stanford/McKinsey AI Latency Report, SQLite WAL vs PostgreSQL Benchmarks, FinTech Trading Case Study, Microservices Failure Analysis, Q4 2025 Executive Shareholder Briefing |
| **Sarah Chen** | `sarah@example.com` | `Password123!` | Neurobiology of Deep Work, NVIDIA Blackwell B200 vs Hopper H100 Hardware Benchmarks |

*(You can also register any new account anytime on the Register page).*

---

## 🧪 Running the Unified Test Suite

Execute all 130 tests across Backend, AI Service, and Playwright Chromium in a single command:

```powershell
npm run test:report
```

Output:
```
======================================================================
 AI CONTENT GENERATOR - UNIFIED TEST EXECUTION REPORT                 
======================================================================
--- 1. BACKEND UNIT & INTEGRATION TESTS (Vitest) --- (77 tests passed)
--- 2. AI SERVICE TESTS (Pytest) ---                 (33 tests passed)
--- 3. FRONTEND E2E TESTS (Playwright Chromium) --- (20 tests passed)
======================================================================
 FINAL REPORT: 130/130 Tests Passed (0 Failed)
 DATABASE INTEGRITY: Actual database (backend/prisma/dev.db) is UNTOUCHED
======================================================================
```

Detailed documentation:
- [docs/PRD-ARCHITECTURE.md](docs/PRD-ARCHITECTURE.md) — Architectural patterns, clean architecture, and threat model.
- [docs/API-CONTRACTS.md](docs/API-CONTRACTS.md) — REST endpoints, payloads, and response envelopes.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Local development, environment setup, and test guide.
