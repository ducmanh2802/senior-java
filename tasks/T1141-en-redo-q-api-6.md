# T1141 — Dịch lại (nội dung đã sửa): q-api-6 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-api-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-api.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-api-6.en.js` đã cũ: **api-030**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-api.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-api-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-api-6 → OK; node scripts/validate.js → OK.

## Notes

api-030 đã được dịch lại đầy đủ trước đó (nội dung EN khớp 100% với VI hiện tại trong js/data/q-api.js: q, a, follow; chú thích trong mẫu code đã dịch sang tiếng Anh; không còn tiếng Việt; tập field q/a/follow như các entry khác, không thêm tags). Không cần sửa file i18n. Đã chạy: node scripts/check-i18n.js q-api-6 → OK — 4 mục đã dịch; node scripts/validate.js → OK — không có lỗi. Không sửa file khác, không commit.
