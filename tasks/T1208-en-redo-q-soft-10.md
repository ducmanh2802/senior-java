# T1208 — Dịch lại (nội dung đã sửa): q-soft-10 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-10.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-soft.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-soft-10.en.js` đã cũ: **behavioral-037**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-soft.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-soft-10.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-soft-10 → OK; node scripts/validate.js → OK.

## Notes

Dịch lại entry `behavioral-037` trong `js/i18n/q-soft-10.en.js` theo bản tiếng Việt hiện tại của `js/data/q-soft.js`. Entry cũ đã có phần dịch chủ thể, nhưng thiếu 2 mục: `### Real-world example` và `### Interview sample answer` (dịch từ `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` của bản tiếng Việt). Thêm 2 mục đó, giữ nguyên id/key/q/tags/follow; không thêm field `refs` vì không phải field cho phép trong i18n (xem ALLOWED trong scripts/check-i18n.js). Không chứa backtick, `${`, hay ký tự tiếng Việt.
- `node scripts/check-i18n.js q-soft-10` → `OK — 8 mục đã dịch.`
- `node scripts/validate.js` → lỗi báo chỉ nằm ở các file khác không sở hữu (lessons-api.js, lessons-sql.js, projects.js, path.js: id `api-0xx` không tồn tại), lỗi cũ trước khi thay đổi; không liên quan đến entry này.
Reviewed-by: check-i18n (translation, no LLM review)
