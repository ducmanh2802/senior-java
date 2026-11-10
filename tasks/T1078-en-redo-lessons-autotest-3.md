# T1078 — Dịch lại (nội dung đã sửa): lessons-autotest-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-autotest.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-autotest-3.en.js` đã cũ: **lesson-autotest-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-autotest.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-autotest-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-autotest-3 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-autotest-005` in `js/i18n/lessons-autotest-3.en.js` from current Vietnamese source in `js/data/lessons-autotest.js`.
- Updated full entry (title, goals, body, exercise prompt/hints/explain, check items) to match current Vietnamese content; translated Vietnamese strings in code comments/examples (e.g., `ket qua` → `results`, `phuong tien` → `source`); kept code identifiers/messages required by tests (e.g., `Cot khong ton tai:`) unchanged.
- No other files modified.
- Verification: `node --check js/i18n/lessons-autotest-3.en.js` OK; `node scripts/check-i18n.js lessons-autotest-3` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (pre-existing warnings only).
Reviewed-by: check-i18n (translation, no LLM review)
