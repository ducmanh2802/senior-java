# T1150 — Dịch lại (nội dung đã sửa): q-banking-3 (1 mục)

Status: DONE

Notes: Re-translated banking-020 in js/i18n/q-banking-3.en.js from the updated Vietnamese source in js/data/q-banking.js. All 5 entries kept; code blocks, ids, urls unchanged; Vietnamese strings inside code blocks translated. Ran `node scripts/check-i18n.js q-banking-3` → OK (5 items). Ran `node scripts/validate.js` → the only errors are pre-existing in files not owned by this task (lessons-api.js, projects.js, path.js, lessons-sql.js); none relate to q-banking-3. No git commit.
Agent: opencode
Owns: `js/i18n/q-banking-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-banking.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-banking-3.en.js` đã cũ: **banking-020**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-banking.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-banking-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-banking-3 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
