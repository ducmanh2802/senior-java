# T1115 — Dịch lại (nội dung đã sửa): lessons-microservices-6 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-microservices-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-microservices.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-microservices-6.en.js` đã cũ: **lesson-microservices-007**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-microservices.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-microservices-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-microservices-6 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-microservices-007` in `js/i18n/lessons-microservices-6.en.js` (only owned file changed).
- Matched current Vietnamese source (lines ~761–1056 in `js/data/lessons-microservices.js`): kept key/fields, preserved `{{...}}` markup, no backticks/`${`.
- Added brief beginner-friendly explanations (2PC, saga, idempotent, 207 Multi-Status, ledger, reconcile, idempotency key, soft delete, 202+job id) consistent with target audience.
- Verified: `node --check js/i18n/lessons-microservices-6.en.js` OK; `node scripts/check-i18n.js lessons-microservices-6` → "OK — 1 mục đã dịch."; `node scripts/validate.js` → OK (no errors). No git commands run, no browser/process-kill, no npm install.
Reviewed-by: check-i18n (translation, no LLM review)
