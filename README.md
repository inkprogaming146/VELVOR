# VELVOR — offline "vibe coding" AI agent (starter)

Overview
- Local-first coding assistant with chat, tools-as-python-scripts, live editor, terminal, and settings.
- Offline LLM support via llama.cpp / llama-cpp-python (GGML).
- Frontend: React + Tailwind + Monaco + xterm.js
- Backend: FastAPI + SQLite
- Code execution sandboxed locally (resource limits). No API keys required.

Quick start (prototype)
1) Install system deps:
   - Linux: git, python3.11, nodejs, npm, build-essential
2) Backend:
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   # Place a compatible GGML model at backend/models/ggml-model.bin
   uvicorn main:app --host 127.0.0.1 --port 8000
3) Frontend:
   cd frontend
   npm install
   npm run dev
4) Run with Docker (recommended for isolation):
   docker-compose up --build --abort-on-container-exit
Notes
- Models must be downloaded separately (see docs/model-recommendations.md).
- To run fully offline, run docker-compose with network: none or start services with no network.
