# T1065 — Dịch lại (nội dung đã sửa): lessons-ai-1 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-ai-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-ai.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-ai-1.en.js` đã cũ: **lesson-ai-001**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-ai.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-ai-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-ai-1 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-ai-001` in `js/i18n/lessons-ai-1.en.js` to match current `js/data/lessons-ai.js` (title/goals/body/exercises/check), keeping key and field set aligned with overlay format.
- Removed copied `starter/tests/reference` from the i18n overlay entry (kept `title`, `prompt`, `hints`, `explain`) to satisfy `check-i18n` rule that translated entries must not duplicate code/artifacts.
- Translated Vietnamese code comment/string in the example to English; no backticks or `${` introduced.
- Verified: `node scripts/check-i18n.js lessons-ai-1` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (only pre-existing warnings shown).
Reviewed-by: check-i18n (translation, no LLM review)
