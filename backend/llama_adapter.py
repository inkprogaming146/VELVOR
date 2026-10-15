from llama_cpp import Llama
from typing import List
import os

class LlamaAdapter:
    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError("Place a GGML model at: " + model_path)
        # llama-cpp-python binding
        self.model = Llama(model_path=model_path, n_ctx=2048)

    def generate(self, messages: List[dict]) -> str:
        # Simple context serialization; you can adapt to your chat formatting
        prompt = "\n".join([f"{m['role']}: {m['text']}" for m in messages[-20:]])
        out = self.model(prompt=prompt, max_tokens=512, temperature=0.8)
        return out["choices"][0]["text"]
