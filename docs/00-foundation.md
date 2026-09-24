# Phase 0: Foundation

**Status:** Complete
**Exit criteria (from ROADMAP.md):** protected `main`, green Scorecard workflow, runner online, this document written.

## What was built

### Repository
- Fresh public repo at `github.com/nullPrivilege15/sentinelpipe`, initialized with
  clean history (not carried over from the original LLM-HackBox repo).
- Both fixture apps copied in and independently re-verified running under
  `docker compose` from their final locations: `app/vulnerable` (LLM-HackBox,
  must fail later gates) and `app/patched` (patched-llm-lab, must pass them).
  Both reach Ollama at `host.docker.internal:11434` and serve HTTP 200.

### Branch protection
- `main` requires PRs; direct pushes are rejected (verified with a live test
  push — see PR #1's predecessor commit, reverted locally, never merged).
- Required approving reviews set to **0**, deliberately: this is a solo-
  maintainer project, and GitHub does not allow self-approval, so a nonzero
  requirement would make `main` unmergeable by its own owner. The actual
  quality gate is `enforce_admins: true` (no bypass, PR required regardless
  of role) plus the automated checks landing in Phases 2–4, not human review.
- Force-push and branch deletion disabled on `main`.

### CODEOWNERS
- Root-level `CODEOWNERS` assigns `@nullPrivilege15` to all paths. Mainly a
  Scorecard/best-practice signal and a pattern for future collaborators on a
  solo project.

### Secret scanning
- Secret scanning and push protection both enabled at the repo level.
- **Honest caveat:** two synthetic test pushes (a malformed fake PAT, and
  AWS's own published example key `AKIAIOSFODNN7EXAMPLE`) did not trigger a
  block or an alert. Most likely explanation is GitHub's allowlisting of
  well-known dummy/example credentials to reduce noise, rather than a real
  detection gap — but this was not conclusively confirmed either way, and is
  recorded here as an unproven claim rather than a verified control.
  **Gitleaks as a local pre-commit hook (Phase 2) is the actually-verified
  secret-catching layer** for this project; push protection is treated as a
  bonus, not the backstop.

### Dependabot
- Repo-level Dependabot security updates enabled.
- `.github/dependabot.yml` covers weekly checks for pip and Docker in both
  app fixtures, plus github-actions.
- First scan surfaced **8 vulnerabilities (6 moderate, 2 low)** across
  `python-dotenv`, `requests`, and `flask` in both apps — ordinary Python
  ecosystem CVEs, not LLM-specific findings. Useful baseline contrast for
  later phases: generic SCA catches this; it structurally can't catch
  prompt injection or model-integrity issues, which is what the custom
  Semgrep rules and red-team gates (Phases 2 and 4) exist for.

### OpenSSF Scorecard
- Workflow live at `.github/workflows/scorecard.yml`, triggered on push to
  `main`, weekly schedule, and `branch_protection_rule` changes. Results
  publish as SARIF to the Security tab.
- All Actions pinned by full commit SHA (`actions/checkout@v7.0.1`,
  `ossf/scorecard-action@v2.4.4`, `github/codeql-action@v4.38.2`).
  Repo-level "Require actions to be pinned to a full-length commit SHA" is
  also enabled, enforcing this for any future workflow.
- **Baseline score: 4.5 / 10** (commit `f348d35`, 2026-09-24).

  | Check | Score | Note |
  |---|---|---|
  | Dangerous-Workflow | 10 | — |
  | Binary-Artifacts | 10 | — |
  | Dependency-Update-Tool | 10 | — |
  | Token-Permissions | 10 | least-privilege confirmed |
  | Pinned-Dependencies | 2 | Docker base images + pip installs not hash-pinned — **deferred to Phase 2/3**, when Dockerfiles are touched for scanning integration anyway |
  | Vulnerabilities | 6 | the 4 distinct CVEs above, doubled across both apps |
  | Branch-Protection | error (-1) | known Scorecard/token limitation reading classic protection rules via API — **not** evidence protection is missing; independently verified via rejected direct-push test |
  | Maintained, Contributors, Code-Review, CI-Tests, SAST, Fuzzing, Signed-Releases, Packaging, CII-Best-Practices, Security-Policy, License | 0 or N/A | expected for a brand-new, solo, pre-CI repository; several are structurally impossible to score well on until later phases add CI, or don't apply until Phase 5 (signing) |

### Self-hosted runner
- Mac Mini registered as `mac-sentinelpipe`, default labels
  (`self-hosted`, `macOS`, `ARM64`), manual start only (`./run.sh`, not
  installed as a background service).
- Fork-PR restrictions configured and documented in
  [`docs/ADR/0001-self-hosted-runner-restrictions.md`](ADR/0001-self-hosted-runner-restrictions.md):
  no self-hosted jobs on `pull_request` triggers, approval required for
  **all** external contributors (not just first-time ones), no
  `pull_request_target` usage, repo-level SHA-pinning enforcement.

### Toolchain
- Installed via Homebrew: `gh`, `pre-commit`, `kind`, `kubectl`, `helm`,
  `cosign`, `syft`, `conftest`. All verified with version checks.

## Known gaps carried forward

- **Docker image / pip pinning** (Scorecard: Pinned-Dependencies = 2) —
  deferred to Phase 2/3.
- **Push protection detection** — enabled but not conclusively proven to
  fire on synthetic secrets; Gitleaks pre-commit (Phase 2) is the real
  backstop.
- **No `LICENSE` or `SECURITY.md`** yet — cheap wins, not blocking, left for
  a later pass.

## Exit criteria check

- [x] Protected `main` (verified via rejected direct push)
- [x] Green Scorecard workflow (run succeeded, SARIF uploaded, score recorded)
- [x] Runner online (registered, restrictions documented in ADR 0001)
- [x] This document
