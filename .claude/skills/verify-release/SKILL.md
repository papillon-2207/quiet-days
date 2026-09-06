---
name: verify-release
description: Verify this local-first diary release with real test evidence; never deploy or use health data.
disable-model-invocation: true
---
# Verify Quiet Days

User-invoked release verification. This workflow does not authorize deployments, uploads, commits, permission changes or reading real backups.

1. Read docs/TEST_REPORT.md and package.json. Identify exact source revision or file snapshot. Use synthetic data only.
2. Run npm run check, npm test, npm run build and npm run test:ui. If dependencies are missing, report and obtain permission before installation.
3. Run npm run test:browser on an environment that permits localhost. A blocked test is NOT a pass. Do not substitute the DOM harness for the origin test or bypass environment policies.
4. Inspect evidence and the four synthetic screenshots. Check changed UI paths with keyboard. Do not claim VoiceOver/TalkBack testing unless actually performed.
5. Verify dist has only public assets, no tests, prompts, health data, secrets, external scripts or analytics. Confirm no manual edits to generated dist.
6. Report commands, exit codes, actual counts, failures, blocked/unrun checks and remaining human/clinical/security review. Separate proven behavior from source-code inspection.
7. If a code defect is found, propose its smallest regression test and patch before changing unrelated code. Preserve failing evidence and rerun relevant checks after the approved fix.
8. Do not mark release ready until full origin tests pass and required manual checks have an explicit owner. Do not publish anything.
