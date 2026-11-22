# Development Guide & Setup

Comprehensive guide for local setup, development workflows, security practices, and testing.

---

## Prerequisites
- **Node.js**: v18+ (tested on v26+)
- **Python**: v3.10+ (tested on v3.15+)
- **Git**
- **Google Gemini API Key**: Obtainable for free from [Google AI Studio](https://aistudio.google.com/)

---

## 1. Quick Start

### 1.1 One-Click Start & Stop Scripts
You can start all 3 services at once:
- **Windows PowerShell**: `.\start.ps1`
- **Windows Command Prompt / Double-click**: `start.bat`
- **Linux / macOS / Git Bash**: `./start.sh`
- **npm**: `npm start`

To stop all running services and free ports 8000, 5000, and 5173:
- **Windows PowerShell**: `.\stop.ps1`
- **Windows Command Prompt / Double-click**: `stop.bat`
- **Linux / macOS / Git Bash**: `./stop.sh`
- **npm**: `npm stop`

Once launched:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000) (Health: `/health`)
- **AI Service Swagger API**: [http://localhost:8000/docs](http://localhost:8000/docs) (Health: `/health`)

---

### 1.2 Pre-Seeded Factual Demo Accounts
The SQLite database (`backend/prisma/dev.db`) is seeded with factual research documents with empirical benchmarks and citations:

| Account | Email | Password | Pre-Loaded Factual Documents |
| :--- | :--- | :--- | :--- |
| **Alex Mercer** | `demo@example.com` | `Password123!` | 1. 2025–2026 Enterprise GenAI Report (Stanford HAI & McKinsey)<br>2. SQLite WAL vs PostgreSQL Concurrency Benchmarks<br>3. FinTech 140M Trading Records Ingestion Case Study<br>4. Why 73% of Microservice Migrations Fail (DORA 2024)<br>5. Q4 2025 Executive Shareholder Briefing |
| **Sarah Chen** | `sarah@example.com` | `Password123!` | 1. Neurobiology of Deep Work (Stanford/MIT Ultradian Focus)<br>2. NVIDIA Blackwell B200 vs Hopper H100 LLM Serving Benchmarks |

*Note: The seeding script runs idempotently. When you start or stop services, existing documents, user edits, and new accounts are strictly preserved.*

---

## 2. Manual Service Setup

### 2.1 Environment Files Configuration
Copy the template files into active `.env` files:
```powershell
# PowerShell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item ai-service/.env.example ai-service/.env
Copy-Item frontend/.env.example frontend/.env
```

Ensure your `GEMINI_API_KEY` is placed inside `ai-service/.env`:
```ini
GEMINI_API_KEY=AIzaSy...your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
AI_SERVICE_TOKEN=dev-secret-internal-ai-service-token-32chars
```

### 2.2 Backend (Node.js + Express + Prisma)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 2.3 AI Service (Python + FastAPI)
```bash
cd ai-service
# Recommended virtual environment
python -m venv .venv
# Activate on Windows:
.\.venv\Scripts\activate
# Activate on Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 2.4 Frontend (React 18 + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```

---

## 3. Testing Guide (130 Unified Tests)

The testing architecture provides multi-tier verification with **zero database tampering**:

```powershell
# From project root: executes all 130 tests across Backend, AI Service, and Playwright Chromium
npm run test:report
```

### 3.1 Backend Tests (Vitest — 77 Tests)
Includes unit use case tests, in-memory repository tests, API integration tests with ephemeral SQLite instances, and dedicated security attack tests:
```bash
cd backend
npm test
```

### 3.2 AI Service Tests (Pytest — 33 Tests)
Includes endpoint validation, prompt templates, refinement strategies, token validation, and prompt injection guardrails:
```bash
cd ai-service
pytest -v
```

### 3.3 Frontend End-to-End Tests (Playwright Chromium — 20 Tests)
Includes authentication, generator workspace, 3-way Markdown/Split view toggling, history library, quick preview modal, and client-side XSS neutralization:
```bash
cd frontend
npx playwright test
```

---

## 4. Key Architectural & Security Rules

1. **Zero Secrets Policy**: The `GEMINI_API_KEY` must **never** be exposed to the client or the Node backend. It resides solely within `ai-service/.env`.
2. **Tenant Privacy by Design**: All database queries for content and versions must enforce `where: { id, userId }`.
3. **Input & Output Sanitization**: All user inputs and AI outputs are filtered through `sanitizeString()` to strip dangerous HTML, `<script>`, `<iframe>`, inline event handlers, and null bytes (`\0`).
4. **Timing Attack Neutralization**: The login use case executes a constant-time dummy bcrypt comparison when an email is not registered to prevent account enumeration.
5. **Prompt Injection Guardrails**: Prompts isolate untrusted reference text in explicit XML tags (`<untrusted_reference_material>`) and enforce system directives forbidding command overrides or credential disclosure.
