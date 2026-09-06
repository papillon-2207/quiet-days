---
paths:
  - "src/components/**/*.js"
  - "src/app.js"
  - "src/lib/dom.js"
  - "src/styles.css"
  - "index.html"
---
# Interaction and accessibility
Read docs/ACCESSIBILITY_ACCEPTANCE.md before changing flows.
Keep one-action capture and progressive disclosure; first symptom details are impact and timing.
No required free text, gesture-only controls, visual-only charts, autoplay speech or blame for gaps.
Native labels/fieldset/legend/details/dialog; keep focus predictable and status announcements concise.
Do not insert user content via innerHTML. Exported notes must be escaped as well.
Saving failure must preserve the newest draft. Urgent help remains accessible.
Run isolated DOM tests, then real origin E2E; report actual screen-reader testing separately.
