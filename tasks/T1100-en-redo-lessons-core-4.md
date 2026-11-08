# T1100 — Dịch lại (nội dung đã sửa): lessons-core-4 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-core-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-core.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-core-4.en.js` đã cũ: **lesson-core-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-core.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-core-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-core-4 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated full `lesson-core-008` entry in `js/i18n/lessons-core-4.en.js` from current VI source in `js/data/lessons-core.js` (lines ~860–1181). Kept same key/field set (title, goals, body, exercises [title/prompt/hints/explain], check); preserved code/ids/structure and followed markup rules (no backtick, no `${`). Only owned file modified.
- Verification: `node scripts/check-i18n.js lessons-core-4` → OK (1 mục đã dịch). `node scripts/validate.js` → OK (no errors).
Reviewed-by: check-i18n (translation, no LLM review)
