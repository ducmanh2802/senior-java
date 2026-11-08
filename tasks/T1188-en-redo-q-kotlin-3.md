# T1188 — Dịch lại (nội dung đã sửa): q-kotlin-3 (8 mục)

Status: DONE
Agent: opencode

Đã dịch lại 8 mục kotlin-019 đến kotlin-026 trong `js/i18n/q-kotlin-3.en.js` sang tiếng Anh chi tiết, tuân thủ đúng markup của dự án. Đã chạy `node scripts/check-i18n.js q-kotlin-3` thành công.
Owns: `js/i18n/q-kotlin-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-kotlin.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-kotlin-3.en.js` đã cũ: **kotlin-019, kotlin-020, kotlin-021, kotlin-022, kotlin-023, kotlin-024, kotlin-025, kotlin-026**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-kotlin.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-kotlin-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-kotlin-3 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
