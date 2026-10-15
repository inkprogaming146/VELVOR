from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, SQLModel, Session, create_engine, select
from pydantic import BaseModel
from pathlib import Path
from typing import Optional, Dict
import json, time, uuid

from llama_adapter import LlamaAdapter
from run_tool import run_python_sandbox

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
DB_FILE = BACKEND_DIR / "velvor.db"
WORKSPACE_DIR = ROOT_DIR / "workspace"
TOOLS_DIR = WORKSPACE_DIR / "tools"
PROJECT_ROOT = ROOT_DIR

DEFAULT_SETTINGS = {
    "username": "Creator",
    "mode": "dark",
    "primaryColor": "#8b5cf6",
    "secondaryColor": "#22c55e",
    "accentColor": "#f59e0b",
}

app = FastAPI(title="VELVOR")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    messages_json: str
    created_at: float = time.time()


class Tool(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str = ""
    file_path: str
    created_at: float = time.time()


class Setting(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True)
    value: str


class Snippet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    body: str
    created_at: float = time.time()


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    prompt: str


engine = create_engine(f"sqlite:///{DB_FILE}")
SQLModel.metadata.create_all(engine)


def ensure_workspace():
    WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
    TOOLS_DIR.mkdir(parents=True, exist_ok=True)


ensure_workspace()
llm = LlamaAdapter(str(BACKEND_DIR / "models" / "ggml-model.bin"))


@app.get("/api/health")
def health():
    return {"status": "ok", "model_ready": llm.ready}


@app.get("/api/settings")
def get_settings():
    with Session(engine) as s:
        rows = s.exec(select(Setting)).all()
        data = {row.key: row.value for row in rows}
    merged = DEFAULT_SETTINGS.copy()
    merged.update(data)
    return merged


@app.post("/api/settings")
def save_settings(payload: Dict[str, str]):
    with Session(engine) as s:
        for key, value in payload.items():
            row = s.exec(select(Setting).where(Setting.key == key)).first()
            if row:
                row.value = str(value)
            else:
                s.add(Setting(key=key, value=str(value)))
        s.commit()
    return get_settings()


@app.get("/api/conversations")
def list_conversations():
    with Session(engine) as s:
        rows = s.exec(select(Conversation).order_by(Conversation.created_at.desc())).all()
        return [{"id": r.id, "title": r.title, "created_at": r.created_at} for r in rows]


@app.post("/api/conversations")
def create_conversation():
    with Session(engine) as s:
        conv = Conversation(title="New conversation", messages_json="[]")
        s.add(conv)
        s.commit()
        s.refresh(conv)
        return {"id": conv.id, "title": conv.title}


@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: int):
    with Session(engine) as s:
        conv = s.get(Conversation, conversation_id)
        if conv:
            s.delete(conv)
            s.commit()
    return {"ok": True}


@app.post("/api/chat")
def chat(req: ChatRequest):
    with Session(engine) as s:
        if req.conversation_id:
            conv = s.get(Conversation, req.conversation_id)
            if not conv:
                raise HTTPException(status_code=404, detail="conversation not found")
            messages = json.loads(conv.messages_json or "[]")
        else:
            conv = Conversation(title="New conversation", messages_json="[]")
            s.add(conv)
            s.commit()
            s.refresh(conv)
            messages = []

    messages.append({"role": "user", "text": req.prompt})
    reply = llm.generate(messages)
    messages.append({"role": "assistant", "text": reply})

    with Session(engine) as s:
        conv = s.get(Conversation, conv.id)
        conv.messages_json = json.dumps(messages)
        conv.title = (req.prompt[:40] + "...") if len(req.prompt) > 40 else req.prompt
        s.add(conv)
        s.commit()

    return {"conversation_id": conv.id, "response": reply}


@app.get("/api/conversation/{conversation_id}")
def get_conversation(conversation_id: int):
    with Session(engine) as s:
        conv = s.get(Conversation, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="conversation not found")
        return {"id": conv.id, "title": conv.title, "messages": json.loads(conv.messages_json or "[]")}


@app.get("/api/project/tree")
def project_tree():
    results = []
    for path in sorted(ROOT_DIR.rglob("*")):
        if ".git" in path.parts or ".venv" in path.parts or "node_modules" in path.parts:
            continue
        rel = path.relative_to(ROOT_DIR).as_posix()
        if rel.startswith("workspace/") or rel.startswith("backend/") or rel.startswith("frontend/") or rel.startswith("docs/") or rel.startswith("README") or rel.startswith("docker-compose"):
            if path.is_dir():
                results.append({"type": "directory", "path": rel})
            else:
                results.append({"type": "file", "path": rel})
    return results


@app.get("/api/file")
def read_file(path: str):
    safe = (ROOT_DIR / path).resolve()
    if ROOT_DIR not in safe.parents and safe != ROOT_DIR:
        raise HTTPException(status_code=400, detail="invalid path")
    if not safe.exists() or not safe.is_file():
        raise HTTPException(status_code=404, detail="file not found")
    return {"path": path, "content": safe.read_text(encoding="utf-8", errors="replace")}


@app.post("/api/file")
def write_file(path: str, content: str):
    safe = (ROOT_DIR / path).resolve()
    if ROOT_DIR not in safe.parents and safe != ROOT_DIR:
        raise HTTPException(status_code=400, detail="invalid path")
    safe.parent.mkdir(parents=True, exist_ok=True)
    safe.write_text(content, encoding="utf-8")
    return {"ok": True, "path": path}


@app.get("/api/tools")
def list_tools():
    with Session(engine) as s:
        rows = s.exec(select(Tool)).all()
        return [{"id": row.id, "name": row.name, "description": row.description, "file_path": row.file_path} for row in rows]


@app.post("/api/tools")
async def create_tool(name: str = Form(...), description: str = Form(""), code: str = Form(...)):
    safe_name = (name.strip() or "tool").replace(" ", "_")
    tool_path = TOOLS_DIR / f"{safe_name}.py"
    tool_path.write_text(code, encoding="utf-8")
    with Session(engine) as s:
        tool = Tool(name=name, description=description, file_path=tool_path.relative_to(ROOT_DIR).as_posix())
        s.add(tool)
        s.commit()
        s.refresh(tool)
        return {"id": tool.id, "name": tool.name, "file_path": tool.file_path}


@app.patch("/api/tools/{tool_id}")
def rename_tool(tool_id: int, payload: Dict[str, str]):
    new_name = payload.get("name", "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="name required")
    with Session(engine) as s:
        tool = s.get(Tool, tool_id)
        if not tool:
            raise HTTPException(status_code=404, detail="tool not found")
        tool.name = new_name
        s.add(tool)
        s.commit()
    return {"ok": True}


@app.delete("/api/tools/{tool_id}")
def delete_tool(tool_id: int):
    with Session(engine) as s:
        tool = s.get(Tool, tool_id)
        if not tool:
            raise HTTPException(status_code=404, detail="tool not found")
        file_path = ROOT_DIR / tool.file_path
        if file_path.exists():
            file_path.unlink()
        s.delete(tool)
        s.commit()
    return {"ok": True}


@app.post("/api/tools/{tool_id}/run")
def run_tool_endpoint(tool_id: int):
    with Session(engine) as s:
        tool = s.get(Tool, tool_id)
        if not tool:
            raise HTTPException(status_code=404, detail="tool not found")
    stdout, stderr, code = run_python_sandbox(str(ROOT_DIR / tool.file_path))
    return {"stdout": stdout, "stderr": stderr, "exit_code": code}


@app.get("/api/snippets")
def list_snippets():
    with Session(engine) as s:
        rows = s.exec(select(Snippet).order_by(Snippet.created_at.desc())).all()
        return [{"id": row.id, "title": row.title, "body": row.body} for row in rows]


@app.post("/api/snippets")
def create_snippet(payload: Dict[str, str]):
    title = payload.get("title", "New snippet").strip() or "New snippet"
    body = payload.get("body", "")
    with Session(engine) as s:
        snippet = Snippet(title=title, body=body)
        s.add(snippet)
        s.commit()
        s.refresh(snippet)
        return {"id": snippet.id, "title": snippet.title, "body": snippet.body}


@app.delete("/api/snippets/{snippet_id}")
def delete_snippet(snippet_id: int):
    with Session(engine) as s:
        snippet = s.get(Snippet, snippet_id)
        if snippet:
            s.delete(snippet)
            s.commit()
    return {"ok": True}
