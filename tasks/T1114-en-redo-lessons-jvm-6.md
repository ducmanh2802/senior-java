# T1114 — Dịch lại (nội dung đã sửa): lessons-jvm-6 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jvm-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-jvm.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-jvm-6.en.js` đã cũ: **lesson-jvm-007**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-jvm.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-jvm-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-jvm-6 → OK; node scripts/validate.js → OK.

## Notes

- `js/i18n/lessons-jvm-6.en.js` already contained a correct, up-to-date English translation of `lesson-jvm-007` (verified line-by-line against the current Vietnamese source in `js/data/lessons-jvm.js`). The only changes since the original T806 translation were two diacritic fixes in the `~~~seq` block ("không trả lời" → "no answer"), which the en file already reflects correctly. No edit was needed.
- Verified: `node --check js/i18n/lessons-jvm-6.en.js` → OK; `node scripts/check-i18n.js lessons-jvm-6` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
