# Healthcare AI Backend (FastAPI + LangChain + LangGraph)

Production-grade backend for a patient dashboard with Gemini-powered agents, MongoDB persistence, and frontend-safe API contracts.

## Integration Changes

- Added GET history endpoints used by the frontend:
  - `/api/history/reports`
  - `/api/history/prescriptions`
  - `/api/history/chat`
  - `/api/history/reminders`
- Improved CORS for local React and Vercel preview/production domains.
- Kept existing POST contracts unchanged.

## API Contract

All responses follow:

```json
{
  "status": "success",
  "data": {},
  "message": "optional"
}
```

On errors:

```json
{
  "status": "error",
  "data": {},
  "message": "error details"
}
```

### POST endpoints

- `POST /api/symptom-check` (JSON, requires `patient_id`)
- `POST /api/prescription-analyze` (FormData: `file`, `patient_id`)
- `POST /api/report-explain` (FormData: `file`, optional `question`, `patient_id`)
- `POST /api/chat` (JSON, requires `patient_id`)
- `POST /api/generate-reminder` (JSON, requires `patient_id`)

### GET history endpoints

- `GET /api/history/reports?patient_id=...`
- `GET /api/history/prescriptions?patient_id=...`
- `GET /api/history/chat?patient_id=...`
- `GET /api/history/reminders?patient_id=...`

## CORS Configuration

- `allow_credentials=True`
- `allow_methods=["*"]`
- `allow_headers=["*"]`
- Origins are configured using `CORS_ORIGINS` and optional regex `CORS_ORIGIN_REGEX`.

Default `.env.example` values include localhost and Vercel-compatible regex.

## Required Environment Variables

```env
GOOGLE_API_KEY=AIzaSyD7vT8WYiLfp30R90FOCtQR5N1tTS2C9qc
MONGO_URI=mongodb://localhost:27017/Patient
```

Also configure:

```env
APP_NAME=Healthcare AI Service
APP_VERSION=1.0.0
API_PREFIX=/api
CORS_ORIGINS=["http://localhost:5173","https://your-frontend.vercel.app"]
CORS_ORIGIN_REGEX=^https://.*\.vercel\.app$
LLM_MODEL=gemini-pro
EMBEDDING_MODEL=models/embedding-001
TEMPERATURE=0.3
MONGO_DB_NAME=healthcare_ai
```

## Google Gemini Setup

1. Create backend env file:

```bash
cp .env.example .env
```

2. Ensure `GOOGLE_API_KEY` is set in `.env`.
3. Gemini is used for:

- symptom agent
- prescription agent
- report agent (LLM + RAG embeddings)
- chat agent

## Local MongoDB (Compass) Setup

1. Install MongoDB Community Server and MongoDB Compass.
2. Start MongoDB locally so port `27017` is available.
3. In MongoDB Compass, connect using:

```text
mongodb://localhost:27017/Patient
```

4. Keep backend `.env` with:

```env
MONGO_URI=mongodb://localhost:27017/Patient
```

The backend writes to database `healthcare_ai` and creates indexes for:

- patients
- reports
- prescriptions
- chats
- reminders

## Local Development

### 1) Install backend dependencies

```bash
pip install -r requirements.txt
```

### 2) Run backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On startup, backend validates both dependencies and logs:

- `MongoDB connected successfully`
- `Gemini initialized successfully`

Health check:

```bash
curl http://localhost:8000/health
```

## Render Deployment

- Build command:

```bash
pip install -r requirements.txt
```

- Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set all environment variables from `.env.example` in Render dashboard.

## Backend Tech Stack and Roles

- FastAPI: API layer and validation
- LangChain: prompt/LLM orchestration
- LangGraph: multi-step workflow chaining
- Gemini API: chat model + embeddings
- MongoDB: persistent patient, report, chat, prescription, and reminder data
