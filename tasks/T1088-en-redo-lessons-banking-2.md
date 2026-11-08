# T1088 — Dịch lại (nội dung đã sửa): lessons-banking-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-banking-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-banking.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-banking-2.en.js` đã cũ: **lesson-banking-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-banking.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-banking-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-banking-2 → OK; node scripts/validate.js → OK.

## Notes
- 2026-11-08: Re-translated `lesson-banking-005` entry in `js/i18n/lessons-banking-2.en.js` to match current Vietnamese source in `js/data/lessons-banking.js` (kept same fields/key; code/ids/URLs unchanged; translated VI strings in code comments/prompts where present). No other entries touched. Verified: `node --check js/i18n/lessons-banking-2.en.js`, `node scripts/check-i18n.js lessons-banking-2` → `OK — 1 mục đã dịch`, `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: check-i18n (translation, no LLM review)
