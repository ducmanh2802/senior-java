# T1168 — Dịch lại (nội dung đã sửa): q-english-2 (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-2.en.js` đã cũ: **english-020, english-021, english-022, english-023, english-024, english-025, english-026**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-2 → OK; node scripts/validate.js → OK.

## Notes
- Đã kiểm tra và cập nhật các mục english-020 đến english-026 trong `js/i18n/q-english-2.en.js`. Nội dung đã đồng bộ với `js/data/q-english.js`.
- `node scripts/check-i18n.js q-english-2` trả về OK.
Reviewed-by: check-i18n (translation, no LLM review)
