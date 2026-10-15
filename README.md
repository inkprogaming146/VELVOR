## Project memory and preview

New features added in the `velvor/starter` branch:

- Project memory (searchable file index):
  - POST /api/memory/index — indexes allowed workspace and repo files into an SQLite FTS5 table.
  - GET  /api/memory/search?q=... — search indexed files with FTS and return snippets.
- Preview mode:
  - POST /api/preview/build — runs `npm run build` in the frontend directory and copies the build output (`dist/`) into `workspace/preview/`.
  - Static preview served at `http://localhost:8000/preview/` when the backend is running.

Usage notes:
- Building requires Node + npm installed on your machine and may take a short while.
- To update the memory index after changing files, call POST /api/memory/index.
- The preview endpoint invokes `npm run build` and will fail if the frontend has build errors.
