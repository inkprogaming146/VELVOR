from typing import List
import os

try:
    from llama_cpp import Llama
    HAS_LLAMA = True
except Exception:
    HAS_LLAMA = False


class LlamaAdapter:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.ready = False
        self.model = None
        if not os.path.exists(model_path):
            return
        if not HAS_LLAMA:
            return
        try:
            self.model = Llama(model_path=model_path, n_ctx=2048)
            self.ready = True
        except Exception:
            self.model = None
            self.ready = False

    def generate(self, messages: List[dict]) -> str:
        if not self.ready or self.model is None:
            prompt_text = "\n".join(f"{m['role']}: {m['text']}" for m in messages[-12:])
            return (
                "VELVOR is running fully offline. "
                "A local language model was not detected yet, so I am responding in fallback mode. "
                "To enable the full model, add a compatible GGML file at backend/models/ggml-model.bin.\n\n"
                f"Context preview:\n{prompt_text[:500]}"
            )

        prompt = "\n".join(f"{m['role']}: {m['text']}" for m in messages[-20:])
        out = self.model(prompt=prompt, max_tokens=512, temperature=0.8)
        return out["choices"][0]["text"].strip()
