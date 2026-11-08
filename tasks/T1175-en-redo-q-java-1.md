# T1175 — Dịch lại (nội dung đã sửa): q-java-1 (12 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-1.en.js` đã cũ: **core-001, core-002, core-003, core-004, core-005, core-006, core-007, core-008, core-009, core-010, core-011, collections-001**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-1 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated all 12 entries in `js/i18n/q-java-1.en.js` from current Vietnamese in `js/data/q-java.js`: core-001..core-011, collections-001. Kept keys/field sets; translated Vietnamese strings in code samples; preserved code/ids/urls; no backticks and no `${`.
- `node --check js/i18n/q-java-1.en.js` → OK.
- `node scripts/check-i18n.js q-java-1` → `OK — 12 mục đã dịch.`
- `node scripts/validate.js` still reports pre-existing errors unrelated to owned file (missing `api-*` refs in `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`). No changes made to those files (out of scope for this task).
Reviewed-by: check-i18n (translation, no LLM review)
