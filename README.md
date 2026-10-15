# VELVOR

VELVOR is a local-first AI coding companion designed for offline, vibe-driven development.

Highlights
- Chat UI with conversations and delete support
- Settings panel for username, light/dark mode, and color themes
- Tool generation and local execution as Python scripts
- Workspace files and live editor
- Prompt snippet library hidden behind the chat menu
- Local backend using FastAPI with a local LLM adapter and sandboxed Python runner

Run locally
1. Start the backend:
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --host 127.0.0.1 --port 8000

2. Start the frontend:
   cd frontend
   npm install
   npm run dev

3. Open http://localhost:5173

Note
- VELVOR is designed to operate fully offline. To use the full local LLM, add a compatible GGML model at backend/models/ggml-model.bin.
