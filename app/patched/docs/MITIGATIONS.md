# MITIGATIONS.md

Tracks each finding from `docs/EXPLOITATION.md`, the mitigation applied in
`patched-llm-lab/`, and residual risk status.

## Finding 7 — System Prompt Leakage (LLM07)

**Mitigations:**
- Removed the real `STAFF20` secret from `SYSTEM_PROMPT` entirely.
- Removed `prompt_debug` from the `/api/chat` response — the system prompt
  is never returned to the client under any condition.
- Added `SENSITIVE_PATTERNS` output-scan backstop.

**Status:** Closed. Both mitigations are structural — they do not depend
on model behavior. Note: the original 43% leak rate and the
100%-reliable `prompt_debug` leak were never real defenses; a model
upgrade or a missed code review could have silently reintroduced full
exploitability. This finding is now closed because there is no secret
left to leak, not because the model became more resistant.

## Finding 5 — Improper Output Handling (LLM05)

**Mitigations:**
- `script.js`: `body.innerHTML = text` → `body.textContent = text` for both
  the primary render path and the raw/rendered toggle.

**Status:** Closed. Structural fix, independent of model output content.
The browser never interprets model output as markup, regardless of what
the model produces, including full hallucinations.

## Finding 1–4 — Prompt Injection / Role Confusion / Fake Admin Override
(LLM01)

**Mitigations:**
- Structural role separation via Ollama `/api/chat` (`system`/`user`
  roles) replacing plain-text concatenation.
- Hardened `SYSTEM_PROMPT`:
  - Explicit refusal of persona adoption and fabricated diagnostic/system
    output.
  - Explicit refusal of instruction-override requests regardless of how
    innocuous the replacement task sounds.
  - Explicit prohibition on format/tense/person changes (e.g. forced
    third-person, forced suffixes).
  - Single fixed terminal refusal sentence, with no continued generation
    permitted afterward.
- Deterministic output-layer backstops in `_scrub_output()`:
  - `DIAGNOSTIC_MARKERS` — catches fabricated system/diagnostic output
    even if the prompt-level refusal only partially holds.
  - `_is_substantive()` — catches non-substantive replies (e.g.
    emoji-only) from successful format-override attacks.
  - `_has_forced_suffix_pattern()` — catches repeated forced-suffix
    compliance (e.g. "...as instructed" appearing 2+ times).

**Status:** Materially reduced, NOT eliminated. Retested against five
payload families (persona/DebugBot, fake-admin-diagnostic, third-person +
forced suffix, emoji-only, innocuous-task override) with 5–7 resampling
trials each post-patch; all currently known payloads are neutralized
either by prompt compliance or by the output-layer backstop.

**Residual risk (explicit):** Prompt-level resistance on a 1B-parameter
local model is inherently probabilistic. The backstops implemented target
the *specific signatures* observed during testing (diagnostic phrasing,
non-substantive output, repeated forced suffixes). A novel override
phrasing with a different replacement task or output pattern not covered
by these signatures could plausibly still succeed. This is a property of
small local models and pattern-based backstops in general, not a defect
specific to this implementation. Do not represent this finding as fully
closed in any external-facing summary — represent it as "reduced with
defense-in-depth" instead.

## Cross-Cutting Notes

- All fixes were validated using the same resampling discipline as the
  original exploitation phase (5–9+ trials per payload, never treating a
  single trial as a stable verdict).
- Two categories of fix exist in this project and should be described
  differently in any report: **structural fixes** (LLM07, LLM05) that hold
  regardless of model behavior, and **probabilistic-reduction fixes**
  (LLM01) that lower but do not guarantee against a given attack class.
- The patched build's `docker-compose.yml` uses a distinct container name,
  network, and host port from the vulnerable build so both can run
  side-by-side for before/after comparison testing.
