# T1081 — Dịch lại (nội dung đã sửa): lessons-autotest-6 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-autotest.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-autotest-6.en.js` đã cũ: **lesson-autotest-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-autotest.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-autotest-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-autotest-6 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated full `lesson-autotest-008` entry (title, goals, body, exercise prompt/hints/explain, 4 check items) from current Vietnamese in `js/data/lessons-autotest.js` (lines 2924-3655).
- Preserved key and all fields; translated Vietnamese strings in code samples/XML examples to English (e.g. "must not be null", "Order successful", "not finished yet"); no backticks or `${`.
- `node --check js/i18n/lessons-autotest-6.en.js` OK; `node scripts/check-i18n.js lessons-autotest-6` → "OK — 1 mục đã dịch."; `node scripts/validate.js` → "OK — không có lỗi." (no new warnings/errors from this change).
Reviewed-by: check-i18n (translation, no LLM review)
