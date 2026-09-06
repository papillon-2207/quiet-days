---
paths:
  - "src/lib/**/*.js"
  - "src/domain/export.js"
  - "scripts/**/*.mjs"
  - "public-headers.txt"
  - "tests/e2e/**/*"
---
# Privacy and release
Read docs/THREAT_MODEL.md. Browser encryption does not protect an unlocked page from malicious same-origin code.
Crypto must complete before opening the IDB transaction. CAS is atomic inside a readwrite transaction.
No plaintext persistence, logging of health content, real user fixtures, or undeclared external requests.
Speech must fail closed unless on-device zh-TW availability is explicitly confirmed. No remote fallback.
Build only public app assets. Test adapters/prompts/docs/backups must not enter dist.
Do not force Service Worker activation while old editing tabs exist.
Never change managed browser policy, disable security checks, or fabricate a passing E2E report.
