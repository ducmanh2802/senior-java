# T1186 — Dịch lại (nội dung đã sửa): q-kotlin-1 (9 mục)

Status: DONE
Agent: opencode

Đã dịch lại toàn bộ các mục kotlin-001 đến kotlin-010 từ tiếng Việt sang tiếng Anh và cập nhật vào `js/i18n/q-kotlin-1.en.js`. Validation `node scripts/check-i18n.js q-kotlin-1` đã OK.

Nội dung tiếng Việt của các mục sau trong `js/data/q-kotlin.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-kotlin-1.en.js` đã cũ: **kotlin-001, kotlin-002, kotlin-003, kotlin-004, kotlin-006, kotlin-007, kotlin-008, kotlin-009, kotlin-010**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-kotlin.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-kotlin-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-kotlin-1 → OK; node scripts/validate.js → OK.

## Notes
