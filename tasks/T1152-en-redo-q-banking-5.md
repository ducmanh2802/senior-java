# T1152 — Dịch lại (nội dung đã sửa): q-banking-5 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-banking-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-banking.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-banking-5.en.js` đã cũ: **banking-025, banking-026**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-banking.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-banking-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-banking-5 → OK; node scripts/validate.js → OK.

## Notes
- Translated banking-025 and banking-026 in `js/i18n/q-banking-5.en.js` from current `js/data/q-banking.js` (kept keys/fields, preserved code/id/tags structure, translated Vietnamese strings including code comments/diagram labels; no backticks/${}).
- Verified: `node scripts/check-i18n.js q-banking-5` → OK (6 mục đã dịch). `node scripts/validate.js` reports pre-existing unrelated errors in lessons-api/sql, projects, path (api-* refs missing) — not from this change; q-banking-5 passes i18n check. No git commit, no processes killed, no browser/npm.
