# T1167 — Dịch lại (nội dung đã sửa): q-english-16 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-16.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-16.en.js` đã cũ: **english-141**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-16.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-16 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `english-141` in `js/i18n/q-english-16.en.js` (q + a + follow preserved keys; polished key-term explanations for clarity/beginner-friendly tone while staying faithful to current VI source).
- `node scripts/check-i18n.js q-english-16` → OK (4 items).
- `node --check js/i18n/q-english-16.en.js` → OK.
- `node scripts/validate.js` → fails with **pre-existing** errors unrelated to this task (lessons-sql.js, lessons-api.js, projects.js, path.js reference missing api-* IDs). I did not touch those files (owned by others) per AGENTS.md rule 3. No syntax/data errors from q-english-16 changes.
Reviewed-by: check-i18n (translation, no LLM review)
