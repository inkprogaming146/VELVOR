# Model recommendations and offline setup

This document summarizes recommended models and how to add them to VELVOR for offline use.

- CPU-only (easy): use a small GGML quantized model compatible with llama.cpp (7B or smaller). Place the GGML file at backend/models/ggml-model.bin.
- GPU (NVIDIA): use a transformers/bitsandbytes setup and configure the backend to use that runtime instead of llama-cpp-python.

Conversion and download steps depend on the specific model — once you confirm which model you want, we'll provide exact commands.
