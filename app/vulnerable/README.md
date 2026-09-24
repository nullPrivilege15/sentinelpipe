# LLM-HackBox

*(formerly developed under the codename "InternBot")*

A deliberately insecure, locally-hosted LLM chat application built to demonstrate, exploit, and remediate real-world vulnerabilities from the **OWASP Top 10 for LLM Applications (2025)** — paired with a fully patched sibling build showing the fixes applied, validated, and empirically compared.

> ⚠️ **For educational/demonstration purposes only.** The vulnerable build is intentionally insecure. Do not deploy it on a public-facing server or use it with real credentials/data.

## Why this project

Most LLM security write-ups are theoretical. LLM-HackBox is a hands-on lab: a working Flask + Ollama chatbot with real, exploitable vulnerabilities, a full exploitation walkthrough for each one, a fully remediated patched build, and an empirical before/after comparison — built to show practical, end-to-end AppSec/AI-security skill across the whole lifecycle: find it, exploit it, fix it, prove the fix.

## Two builds, side by side

| | Path | Port | Purpose |
|---|---|---|---|
| **Vulnerable build** | `web/` (repo root) | 5000 | Original insecure app; source of all exploitation findings |
| **Patched build** | `patched-llm-lab/` | 5001 | Structurally and behaviorally remediated version, runnable independently and side-by-side with the vulnerable build for comparison |

## Vulnerabilities covered

| Payload category | OWASP mapping | Exploited | Patched |
|---|---|---|---|
| Ignore Instructions / Direct Prompt Injection | LLM01 – Prompt Injection | ✅ | ✅ |
| Fake Admin / System Override / Role Confusion | LLM01 – Prompt Injection | ✅ | ✅ |
| Reveal System Prompts | LLM07 – System Prompt Leakage | ✅ | ✅ |
| Direct Data Exfiltration | LLM07 – System Prompt Leakage | ✅ | ✅ |
| HTML Injection | LLM05 – Improper Output Handling | ✅ | ✅ |

Full exploitation walkthroughs: [`docs/EXPLOITATION.md`](docs/EXPLOITATION.md)
Formal write-up with CVSS scoring: [`docs/InternBot_Security_Assessment_Report.pdf`](docs/InternBot_Security_Assessment_Report.pdf)
Patched-build fixes and residual risk: [`patched-llm-lab/docs/MITIGATIONS.md`](patched-llm-lab/docs/MITIGATIONS.md)
Empirical before/after comparison: [`patched-llm-lab/docs/BEFORE_AFTER_COMPARISON.md`](patched-llm-lab/docs/BEFORE_AFTER_COMPARISON.md)

## Architecture

```
Browser (chat UI)
      │
      ▼
Flask app (web/app.py)  ──►  Ollama (llama3.2:1b)
      │
      ▼
Docker Compose (local orchestration)
```

The patched build (`patched-llm-lab/`) mirrors this architecture exactly, on an isolated Docker network/port, so both builds can run at the same time without conflict.

## Tech stack

- **Backend:** Python / Flask
- **LLM runtime:** Ollama (`llama3.2:1b`)
- **Orchestration:** Docker Compose
- **Environment:** macOS (M4 Mac Mini)

## Getting started

**Vulnerable build:**
```bash
git clone https://github.com/nullPrivilege15/LLM-HackBox.git
cd LLM-HackBox
cp .env.example .env        # fill in local config
docker compose up
```
Available at `http://localhost:5000`.

**Patched build (optional, runs independently):**
```bash
cd patched-llm-lab
docker compose up
```
Available at `http://localhost:5001`.

## Project structure

```
LLM-HackBox/
├── web/                   # Vulnerable Flask application + UI
│   ├── app.py
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── static/
│   └── templates/
├── docs/
│   ├── EXPLOITATION.md                    # Step-by-step exploit walkthroughs
│   ├── InternBot_Security_Assessment_Report.pdf  # Formal CVSS-scored report
│   ├── phase-1-foundation.md
│   ├── phase-1-part-2-Step-3.md
│   └── payloads/                          # Evidence per vulnerability category
├── patched-llm-lab/                       # Remediated build — runs independently
│   ├── web/                               # Patched Flask app + UI
│   ├── docker-compose.yml
│   └── docs/
│       ├── documentation.md               # Fixes applied + issues faced during remediation
│       ├── MITIGATIONS.md                 # Finding-by-finding fix tracker + residual risk
│       ├── BEFORE_AFTER_COMPARISON.md     # Empirical vulnerable-vs-patched results
│       └── evidence/                      # Patched-build retest screenshots
└── docker-compose.yml
```

## Exploitation & remediation

- **Exploitation:** [`docs/EXPLOITATION.md`](docs/EXPLOITATION.md) — each vulnerability covers the vulnerable code path, a reproducible exploit, resampled trial results, and impact.
- **Remediation:** [`patched-llm-lab/docs/documentation.md`](patched-llm-lab/docs/documentation.md) — what was fixed, how, and the problems encountered while patching (including cases where an initial fix was incomplete and had to be hardened further under retesting).
- **Mitigation tracking:** [`patched-llm-lab/docs/MITIGATIONS.md`](patched-llm-lab/docs/MITIGATIONS.md) — per-finding fix status, distinguishing **structural fixes** (hold regardless of model behavior) from **probabilistic-reduction fixes** (reduce but don't eliminate risk), plus explicitly documented residual risk.
- **Comparison:** [`patched-llm-lab/docs/BEFORE_AFTER_COMPARISON.md`](patched-llm-lab/docs/BEFORE_AFTER_COMPARISON.md) — the same attack payloads re-run against the patched build, with evidence.

## Key methodological principle

Model behavior — including a hardened system prompt — is never treated as a security control on its own. Every finding in this project distinguishes between fixes that hold **unconditionally** (e.g. removing a secret from context, rendering output as plain text) and fixes that **reduce but do not guarantee against** a given attack class (e.g. prompt-level instruction hardening on a small local model). This distinction is carried through the exploitation findings, the patched-build fixes, and the final risk write-up.

## Disclaimer

This project is built strictly for security research, training, and portfolio demonstration. All testing was performed against a local, self-hosted instance with no real user data.

## Author

**Tathagat** — Application Security Engineer
[LinkedIn](https://www.linkedin.com/in/tathagat-biswas/)
