# AI Content Generator (Version 1 - MVP)

A full-stack, enterprise-grade AI Content Generation platform built with **React**, **Node.js/Express**, **Python/FastAPI**, **SQLite**, **Prisma**, and **Google Gemini**.

---

## 🌟 Key Features

- **Multi-Format Content Generation**:
  - Blog Posts & Articles
  - Social Media Posts (LinkedIn, Instagram, X/Twitter)
  - Professional Emails
  - Marketing Copy & Advertisements
  - Product Descriptions
  - Study Notes & Educational Summaries
  - Formal Reports & Announcements
  - Creative Writing & Stories
- **Customization Parameters**:
  - Tones: Professional, Casual, Friendly, Persuasive, Informative, Creative, Humorous, Academic
  - Target Lengths: Short (~100-200 words), Medium (~300-500 words), Long (~700-1000 words)
  - Target Audience, Keywords, Context, and Reference Material
- **Interactive In-Editor Refinement**:
  - Instant actions: *Rewrite*, *Improve Grammar*, *Simplify*, *Expand*, *Shorten*, *Change Tone*, *Improve Readability*
  - Generate up to 3 distinct alternatives (variations)
  - Manual live editing with character and word count metrics
- **Version History & Snapshots**:
  - Automatic version preservation upon generation, refinement, and edits
  - Browse and restore previous version snapshots
- **Content Management**:
  - Real-time search across titles and body text
  - Filter by content type, sort by date or title
  - Rename, delete, and manage documents
- **Export Capabilities**:
  - One-click copy to clipboard
  - Export to Plain Text (`.txt`)
  - Export to Markdown (`.md`)
- **Dedicated Markdown Viewer & Split View Workspace**:
  - 3-Way view toggle: Raw Editor, Rendered Markdown View, and Side-by-Side Split View
  - Typography rendering, styled tables, blockquotes, syntax code blocks with one-click copy
  - Quick Markdown Preview modal in Content Library
- **Robust Security & Threat Hardening (OWASP Aligned)**:
  - Input sanitizer stripping script tags, event handlers, and pseudo-protocols
  - Constant-time timing side-channel mitigation for authentication
  - Prompt injection guardrails with XML structural isolation
  - Helmet security headers, strict CORS whitelisting, and multi-tier rate limiting
- **Comprehensive 130-Test Suite & Database Isolation**:
  - Backend Unit & Integration tests (Vitest)
  - AI Service tests (Pytest)
  - End-to-end user workflows (Playwright Chromium)
  - Zero database alteration guarantees
- **Multi-Tenant Data Isolation**:
  - Every query is strictly scoped by the authenticated user ID
  - Gemini API key resides strictly inside the private FastAPI runtime
  - Token-authenticated internal service communication between Node and FastAPI
  - Strict input validation using Zod and Pydantic

---

## 🏗️ Architecture

```
ai-content-generator/
├── frontend/               # React 18 + Vite + TypeScript + Tailwind CSS
├── backend/                # Node.js + Express + Prisma + SQLite (Modular Monolith)
├── ai-service/             # Python + FastAPI + Google GenAI SDK (Strategy Pattern)
├── docs/                   # PRD, Architecture, and API specifications
│   ├── PRD-ARCHITECTURE.md
│   ├── API-CONTRACTS.md
│   └── DEVELOPMENT.md
├── .env.example
├── .gitignore
└── README.md
```

Detailed architectural diagrams and pattern documentation are available in [docs/PRD-ARCHITECTURE.md](docs/PRD-ARCHITECTURE.md).

---

## 🚀 Getting Started

### One-Click Start & Stop Scripts

You can launch and stop the entire stack (AI service, Node API, and React Frontend) with the provided scripts:

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
npm start   # Launches all services
npm stop    # Stops all services
```

Once started:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **AI Service OpenAPI Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### 👤 Demo Accounts (Pre-seeded)
You can log in immediately using either of these pre-seeded accounts:
- **Primary Account**: `demo@example.com` / `Password123!` *(User: Alex Mercer — includes 3 sample documents)*
- **Secondary Account**: `sarah@example.com` / `Password123!` *(User: Sarah Chen — to test cross-user data isolation)*
*(Or create a new account anytime via the "Register" page)*

Please see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for step-by-step installation, environment configuration, database migration, and test execution instructions.
