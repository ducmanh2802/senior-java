# T1071 — Dịch lại (nội dung đã sửa): lessons-architecture-5 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-architecture-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-architecture.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-architecture-5.en.js` đã cũ: **lesson-architecture-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-architecture.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-architecture-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-architecture-5 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-architecture-008` in `js/i18n/lessons-architecture-5.en.js` to match current Vietnamese content in `js/data/lessons-architecture.js` (updated title/body/goals/exercise prompt+explain/check explanations; kept key and allowed translatable fields only; no code/starter/tests/reference copied).
- Preserved `lesson-architecture-007` unchanged.
- `node scripts/check-i18n.js lessons-architecture-5` → OK (2 mục đã dịch).
- `node scripts/validate.js` → OK (no errors; existing warnings unchanged).
Reviewed-by: check-i18n (translation, no LLM review)
