from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, SQLModel, Session, create_engine, select
from typing import Optional, List
import os, subprocess, json, uuid, shutil, time
from pydantic import BaseModel
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
DB_FILE = APP_DIR / "velvor.db"
MODEL_PATH = APP_DIR / "models" / "ggml-model.bin"

app = FastAPI(title="VELVOR Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB models ---
class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    messages_json: str  # serialized list of {role, text}
    created_at: float = time.time()

class Tool(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    filename: str
    description: Optional[str] = ""
    created_at: float = time.time()

engine = create_engine(f"sqlite:///{DB_FILE}")
SQLModel.metadata.create_all(engine)

# --- LLM adapter (llama.cpp via llama-cpp-python) ---
from .llama_adapter import LlamaAdapter
from .run_tool import run_python_sandbox

llm = LlamaAdapter(str(MODEL_PATH))

# --- API endpoints ---
class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    prompt: str

@app.post("/api/chat")
async def chat(req: ChatRequest):
    # append prompt to conversation, call model, save response
    with Session(engine) as s:
        if req.conversation_id:
            conv = s.get(Conversation, req.conversation_id)
            if not conv:
                raise HTTPException(404, "conversation not found")
            messages = json.loads(conv.messages_json)
        else:
            conv = Conversation(title="New conversation", messages_json="[]")
            s.add(conv); s.commit(); s.refresh(conv)
            messages = []
        messages.append({"role":"user","text":req.prompt})
        # get model response
        resp_text = llm.generate(messages)
        messages.append({"role":"assistant","text":resp_text})
        conv.messages_json = json.dumps(messages)
        s.add(conv); s.commit(); s.refresh(conv)
        return {"conversation_id": conv.id, "response": resp_text}

@app.get("/api/conversations")
def list_conversations():
    with Session(engine) as s:
        convs = s.exec(select(Conversation)).all()
        return [{"id":c.id,"title":c.title,"created_at":c.created_at} for c in convs]

@app.delete("/api/conversations/{conv_id}")
def delete_conv(conv_id: int):
    with Session(engine) as s:
        conv = s.get(Conversation, conv_id)
        if conv:
            s.delete(conv); s.commit()
    return {"ok": True}

# Tools endpoints
@app.post("/api/tools/create")
async def create_tool(name: str = "", file: UploadFile = File(...), description: str = ""):
    tools_dir = APP_DIR / "workspace" / "tools"
    tools_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    path = tools_dir / filename
    with open(path, "wb") as f:
        f.write(await file.read())
    with Session(engine) as s:
        tool = Tool(name=name or file.filename, filename=str(path), description=description)
        s.add(tool); s.commit(); s.refresh(tool)
        return {"id": tool.id, "name": tool.name, "filename": tool.filename}

@app.get("/api/tools")
def list_tools():
    with Session(engine) as s:
        tools = s.exec(select(Tool)).all()
        return [{"id":t.id, "name":t.name, "filename":t.filename} for t in tools]

@app.post("/api/tools/run/{tool_id}")
def run_tool(tool_id: int, args: Optional[str] = ""):
    with Session(engine) as s:
        tool = s.get(Tool, tool_id)
        if not tool:
            raise HTTPException(404, "tool not found")
    out, err, code = run_python_sandbox(tool.filename, args.split())
    return {"stdout": out, "stderr": err, "exit_code": code}

# Settings, snippets endpoints left as an exercise in full scaffold
