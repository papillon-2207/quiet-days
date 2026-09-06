# Quiet Days / 留白

Local-first Traditional Chinese personal cycle/symptom diary for blind/low-vision users and low-energy days. Static ES modules; no runtime dependencies or backend. This is not a medical diagnostic product.

## Commands
- `npm run dev` — source server; no Service Worker.
- `npm run check && npm test && npm run build` — syntax/invariants, Node tests, static build.
- `npm run test:ui` — isolated production-component DOM, NOT origin E2E.
- `npm run test:browser` — real origin, no mocks; nonzero on blocked/failed.
- `npm run verify:release` — all checks; requires Python Playwright.

## Non-negotiable invariants
- Missing, unasked, uncertain, explicitly absent, and present are distinct.
- Preserve occurrence date, actual input time, per-field provenance, recall and edits. Same-day is not necessarily real-time.
- Only user-confirmed bleeding plus confirmed onset anchors a cycle. Do not infer bleeding/PMS from symptoms or app inactivity.
- One-action capture, optional enrichment, no forced questionnaire or streak/shame mechanics.
- Persist only encrypted vaults. No analytics, remote AI, CDN scripts, cloud speech fallback or raw audio storage.
- Serial writes + atomic IndexedDB revision CAS; never overwrite a newer pending edit after failure. Help cannot be blocked by saving.
- Respectful zh-TW copy, native semantic controls, focus recovery and live status. Never claim WCAG certification from automated checks.
- Never open real health backups, secrets or user datasets. Use synthetic fixtures only; no patient data in prompts/logs/screenshots.

## Workflow
Read `docs/TEST_REPORT.md`, `docs/REQUIREMENTS.md` and the relevant domain document before changing behavior. Explore → plan → request approval → implement the smallest verified patch. Do not deploy, push, commit, add paid services or change permissions without explicit approval.

Known environment limit: the delivery Chromium blocks all URLs. The 31 DOM checks do not validate native ESM/CSP/IndexedDB/PWA integration. Reproduce full E2E on an allowed machine; never bypass managed policies or weaken tests to obtain green output.

Use scoped rules in `.claude/rules/`; invoke `/verify-release` manually. Full continuation task: `prompts/CONTINUE.zh-TW.md`. Architecture, threat model and clinical boundaries are under `docs/`. Do not load the entire conversation archive into every turn; read it only when a requirement is disputed.

When summarizing progress, preserve changed paths, commands/results, unverified limitations and remaining tasks. Do not label an unrun test passed. Do not edit `dist` directly; rebuild it.
