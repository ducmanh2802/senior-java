# T1222 — Dịch lại (nội dung đã sửa): q-spring-data-7 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-7.en.js` đã cũ: **db-018, spring-022, spring-023, spring-026**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-7 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `db-018`, `spring-022`, `spring-023`, `spring-026` in `js/i18n/q-spring-data-7.en.js` from current Vietnamese sources in `js/data/q-spring-data.js`. Other entries unchanged.
- Translated Vietnamese strings in code examples to English where present (e.g., error/label text in `spring-026`); kept code/ids/keys intact; no backticks or `${` in templates.
- Verification: `node --check js/i18n/q-spring-data-7.en.js` OK, `node scripts/check-i18n.js q-spring-data-7` → `OK — 9 mục đã dịch`, `node scripts/build-light-index.js` regenerated `js/data/index-light.js`, `node scripts/validate.js` → `OK — không có lỗi.` No git commands run.
Reviewed-by: check-i18n (translation, no LLM review)
