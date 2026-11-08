# T1112 — Dịch lại (nội dung đã sửa): lessons-jvm-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jvm-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-jvm.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-jvm-2.en.js` đã cũ: **lesson-jvm-003**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-jvm.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-jvm-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-jvm-2 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-jvm-003` in `js/i18n/lessons-jvm-2.en.js` to match current `js/data/lessons-jvm.js` (title, goals, full body, both exercise prompts/hints/explain, all 4 check items). Kept same fields/keys; code kept as-is (no Vietnamese in code/markup). No other entries modified.
- `node --check js/i18n/lessons-jvm-2.en.js` OK.
- `node scripts/check-i18n.js lessons-jvm-2` → `OK — 1 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.` (pre-existing warnings only).
Reviewed-by: check-i18n (translation, no LLM review)
