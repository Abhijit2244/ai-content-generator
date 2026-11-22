# Development Guide & Setup

## Prerequisites
- **Node.js**: v18+ (verified on v26+)
- **Python**: v3.10+ (verified on v3.15+)
- **Git**
- **Google Gemini API Key** (from Google AI Studio)

---

## 1. Quick Start

### 1.0 One-Click Start & Stop Scripts
You can start all 3 services at once using the start scripts:
- **Windows PowerShell**: `.\start.ps1`
- **Windows Command Prompt / Double-click**: `start.bat`
- **Linux / macOS / Git Bash**: `./start.sh`
- **npm**: `npm start`

To stop all running services and free ports 8000, 5000, and 5173:
- **Windows PowerShell**: `.\stop.ps1`
- **Windows Command Prompt / Double-click**: `stop.bat`
- **Linux / macOS / Git Bash**: `./stop.sh`
- **npm**: `npm stop`

---

### Demo Accounts for Quick Testing
The local SQLite database includes pre-seeded demo accounts:

| Name | Email | Password | Pre-loaded Content |
| :--- | :--- | :--- | :--- |
| **Alex Mercer** | `demo@example.com` | `Password123!` | Blog Article, Study Notes, Email Announcement |
| **Sarah Chen** | `sarah@example.com` | `Password123!` | LinkedIn Post (to test tenant isolation) |

*(You can also register any new account on the register page)*

---

### 1.1 Root Setup
Copy environment files:
```bash
# In the ai-content-generator directory
cp .env.example .env
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env
```
*(On Windows PowerShell, use `Copy-Item .env.example .env`)*

---

### 1.2 Backend (Node.js + Express + Prisma)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
Backend runs on: `http://localhost:5000`

---

### 1.3 AI Service (Python + FastAPI)
```bash
cd ai-service
# Create and activate virtual environment (optional but recommended)
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
FastAPI runs on: `http://localhost:8000`
Swagger UI / OpenAPI documentation: `http://localhost:8000/docs`

---

### 1.4 Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 2. Running Tests

### Backend Tests
```bash
cd backend
npm test
```

### AI Service Tests
```bash
cd ai-service
pytest
```

### Frontend Tests / Build
```bash
cd frontend
npm run build
```

---

## 3. Key Architectural Rules
1. **Never put Gemini keys in frontend or backend!** It lives solely in `ai-service/.env`.
2. **All content queries require authenticated user ID**: database-level isolation.
3. **Structured Prompts**: Content templates isolate instructions from untrusted user reference inputs.
