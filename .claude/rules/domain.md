---
paths:
  - "src/domain/**/*.js"
  - "tests/unit/domain.test.mjs"
---
# Data and medical boundaries
Read docs/ARCHITECTURE.md and docs/MEDICAL_BOUNDARIES.md.
Use local civil dates, not UTC slicing. No implicit zeros for missing observations.
Validate enum combinations and imports at the boundary. Preserve per-field source and recall.
Model changes require migration planning and synthetic round-trip tests; do not silently reinterpret old records.
Prediction thresholds are engineering choices, not diagnostic criteria or calibrated confidence.
Formal clinical scales cannot be shortened, scored or marketed as validated by this diary.
