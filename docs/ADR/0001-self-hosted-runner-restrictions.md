# ADR 0001: Self-Hosted Runner on a Public Repository — Restrictions

## Status
Accepted

## Context

SentinelPipe uses a Mac Mini as a self-hosted GitHub Actions runner (`mac-sentinelpipe`)
to run jobs that need local resources not available on GitHub-hosted runners —
specifically, reaching Ollama at `host.docker.internal:11434` for the LLM red-team
gates in later phases (Phase 4, Phase 8).

Because SentinelPipe is a **public** repository, this is a genuine security risk if
misconfigured: GitHub Actions on public repos will run workflows triggered by any
fork's pull request by default, unless explicitly restricted. A `pull_request` (not
`pull_request_target`) trigger from a fork does not have write access to secrets by
default, but a self-hosted runner executing *any* attacker-controlled workflow code
still means arbitrary code execution on real hardware — the Mac Mini itself, not an
ephemeral cloud VM. An attacker forking this repo and opening a PR with a modified
workflow file could otherwise get their code to run on this machine.

## Decision

1. **No workflow in this repository targets `runs-on: self-hosted` on a
   `pull_request` trigger.** Self-hosted jobs are restricted to:
   - `workflow_dispatch` (manually triggered by a maintainer)
   - Triggers scoped to protected branches only (e.g. `push` to `main`,
     which requires a merged, reviewed PR to reach)
2. **Required approval for all external contributors.** Repository setting
   "Require approval for all external contributors" is enabled under
   Actions > General, meaning any workflow run triggered by a pull request
   from anyone who is not a member or owner of this repository requires
   explicit maintainer approval before it executes, regardless of trigger
   type or the contributor's prior history with the repo.
3. **The runner is not run as a background service.** It is started manually
   (`./run.sh`) only when actively needed for a specific pipeline run, and
   stopped afterward. It does not sit listening for jobs continuously.
4. **No `pull_request_target` trigger is used anywhere in this repository.**
   This trigger runs with the base branch's workflow file and secrets access
   even for fork PRs — combined with a fork checkout, this is the single most
   dangerous documented GitHub Actions misconfiguration pattern.
5. **SHA-pinning is enforced at the repository level**, not just by convention.
   Actions > General > "Require actions to be pinned to a full-length commit
   SHA" is enabled, so a workflow referencing an Action by tag (`@v4`) instead
   of a full commit SHA is rejected outright, rather than relying on manual
   review to catch it.

## Consequences

- LLM red-team gates and other self-hosted-dependent jobs can only be triggered
  by the maintainer directly, or by code that has already passed PR review and
  merged to a protected branch. This is slower than allowing PR-triggered runs,
  but eliminates the fork-PR-to-host-RCE attack path entirely.
- If this project ever gains outside contributors, this ADR's restrictions
  must be re-verified before granting any external PR the ability to trigger
  self-hosted jobs, even indirectly.

## References
- https://securitylab.github.com/research/github-actions-preventing-pwn-requests/
- https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
