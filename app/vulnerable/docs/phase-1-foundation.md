# Phase 1: Foundation — Containerized LLM Infrastructure

**Project:** Vulnerable LLM Lab
**Phase scope:** Environment setup and a verified, containerized pipeline connecting a Flask web service to a locally-hosted LLM.
**Status:** Complete and verified end-to-end.

---

## Summary

Before demonstrating any security vulnerability, the lab needed a working, reproducible base to build on: a Dockerized web application that can reliably reach a local LLM inference engine. This phase covers that foundation — the infrastructure decisions, the trust boundaries they establish, and the verification steps used to confirm each layer works before the next was added.

This document is written for a technical reviewer evaluating engineering judgment and debugging methodology, not just the end result. Later phases (`docs/phase-2-...`) cover the actual OWASP LLM Top 10 exploitation and remediation work this foundation supports.

## Skills demonstrated in this phase

- Docker containerization and multi-service orchestration via Compose
- Container networking (bridge networks, host-to-container communication boundaries)
- Environment-specific architecture decisions (Apple Silicon GPU constraints)
- Secrets and configuration management (runtime injection vs. image-baked config)
- Systematic diagnosis and recovery from environment-state issues without data loss

---

## Architecture

```
 Browser
    │  HTTP :5000
    ▼
 ┌─────────────────────────┐        ┌────────────────────────────┐
 │  Docker container          │        │  Host machine (native)         │
 │  Flask web service          │──────▶│  Ollama inference engine        │
 │  chat logic, logging        │  HTTP │  llama3.2:1b                    │
 │                              │ :11434│                                 │
 └─────────────────────────┘        └────────────────────────────┘
```

**Why the LLM runtime is not containerized:** Docker Desktop on Apple Silicon runs containers inside a Linux virtual machine that does not have passthrough access to the host's Metal GPU. Containerizing the inference engine would force CPU-only inference. Running it natively while containerizing only the web-facing service keeps isolation where it's actually needed — around the component handling untrusted input — without sacrificing inference performance. This is also representative of a common real-world pattern: application logic and model-serving infrastructure are frequently operated as separate, independently-scaled services.

## Key engineering decisions

| Decision | Rationale |
|---|---|
| `python:3.11-slim` base image | Minimizes attack surface and image size versus the full Python image |
| Dependencies installed before app code is copied into the image | Leverages Docker's layer caching — code changes don't force a full dependency reinstall on rebuild |
| Flask bound to `0.0.0.0`, not `127.0.0.1` | Required for the host to reach the service at all; a container's loopback interface is not externally reachable |
| Config and secrets injected via `env_file` at runtime, excluded from the image via `.dockerignore` | Same image can be reused across environments without secrets baked into a layer; standard config/secrets separation |
| `host.docker.internal` as the LLM endpoint | Docker Desktop's mechanism for a container to reach a service running on the host machine, since `localhost` inside a container refers to the container itself |
| Local source mounted as a volume | Enables live iteration during development without rebuilding the image on every change |

## Verification methodology

Each layer was proven independently before the next was built on top of it, rather than debugging the whole stack at once:

1. **Container liveness** — a root health endpoint confirms the Flask process itself is up and reachable from the host.
2. **Cross-boundary connectivity** — a second endpoint performs a real request from inside the container to the native Ollama process and returns the result, proving the full network path (host browser → container → host LLM process) end-to-end, not just that each piece works in isolation.

```bash
curl http://localhost:5000/
# → Vulnerable LLM Lab — web container is alive.

curl http://localhost:5000/health-check-ollama
# → {"model":"llama3.2:1b","ollama_reachable":true,"sample_reply":"OK."}
```

## Engineering notes: diagnosing an environment issue without guessing

Partway through this phase, repeated `mkdir`/`touch` commands run from an already-nested directory produced four levels of duplicate project folders, three of them empty. Rather than deleting anything on assumption, the approach taken was:

1. Enumerate every copy of a known config file across the filesystem to see the actual scope of the problem.
2. Programmatically check line counts of key files at each nesting level, rather than opening each one manually, to identify which single copy held the real, non-empty content.
3. Move the verified-good copy to a clean path, then remove the confirmed-empty duplicates — deletion only after the data to keep had been positively identified.

The same evidence-first approach was applied when `docker compose build` failed with `the Dockerfile cannot be empty`: rather than assuming which file was at fault, every project file was checked by line count in one pass, which correctly identified three empty files (a Dockerfile, `.env`, and `.gitignore`) that had silently failed to save during the folder migration.

This reflects a broader habit carried through the rest of the project: when the system reports unexpected state, verify what's actually on disk before making changes, rather than trusting what should be there.

## Tech stack (this phase)

| Component | Choice | Notes |
|---|---|---|
| Containerization | Docker + Docker Compose | Single-service compose file, extensible for later phases |
| Web framework | Flask 3.0 | Synchronous, minimal boilerplate |
| LLM runtime | Ollama, `llama3.2:1b` | Local, no API costs, no external data exposure |
| Language | Python 3.11 | Matches container base image |
| Config | `python-dotenv` + Compose `env_file` | Environment-specific values kept out of source and image |

## Next phase

Phase 2 builds a chat interface on top of this foundation with three deliberately introduced vulnerabilities — unstructured system/user prompt concatenation, an embedded secret used as a leakage target, and unsanitized rendering of model output into the DOM — then documents live exploitation of each, mapped to LLM01:2025 (Prompt Injection) and LLM05:2025 (Improper Output Handling) from the OWASP Top 10 for LLM Applications, followed by concrete remediations for each.
