# T524 — Dịch lại (nội dung đã sửa): q-english-5 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-5.en.js` đã cũ: **english-058, english-059, english-060, english-061, english-062, english-063**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-5 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ 6 entry (english-058 → 063) theo bản tiếng Việt hiện tại trong `js/data/q-english.js`.
- Cấu trúc mới bám theo bản Việt: `### Details and WHY`, `### Common mistakes for Vietnamese speakers`, bảng `### Suggested STAR structure` (english-063), `### What the interviewer wants to hear` và `> Senior tip` (english-063).
- Các câu Sample answer tiếng Anh trong bản Việt được chép nguyên văn, kể cả phần cập nhật mới của english-061/062/063; phần tiếng Việt trong ngoặc và tiêu đề bảng đã dịch.
- Chỉ sửa `js/i18n/q-english-5.en.js`. `node scripts/check-i18n.js q-english-5` → OK (6 mục), `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
