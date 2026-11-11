# T1101 — Dịch lại (nội dung đã sửa): lessons-db-2 (1 mục)

Status: DONE
Agent: opencode

Đã cập nhật nội dung lesson-db-005 trong js/i18n/lessons-db-2.en.js theo bản tiếng Việt mới nhất.
Đã chạy node scripts/check-i18n.js lessons-db-2 và node scripts/validate.js, kết quả OK.
Owns: `js/i18n/lessons-db-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-db.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-db-2.en.js` đã cũ: **lesson-db-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-db.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-db-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-db-2 → OK; node scripts/validate.js → OK.

## Notes
