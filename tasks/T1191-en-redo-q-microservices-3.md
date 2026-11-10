# T1191 — Dịch lại (nội dung đã sửa): q-microservices-3 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-microservices-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-microservices.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-microservices-3.en.js` đã cũ: **microservices-025, microservices-026**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-microservices.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-microservices-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-microservices-3 → OK (9 mục đã dịch). node scripts/validate.js → exit 1, nhưng TẤT CẢ lỗi nằm trong các file KHÔNG sở hữu bởi task này (lessons-sql.js, lessons-api.js, projects.js, path.js liên quan id `api-*` không tồn tại), không liên quan đến microservices-025/026 và không phải file của task. Không được sửa file của người khác theo luật 3 AGENTS.md.

## Notes
- So sánh bản Việt hiện tại (`js/data/q-microservices.js`) với bản Anh cũ: entry microservices-025 (deadline propagation) và microservices-026 (Bulkhead) thiếu đoạn `~~~seq` diagram (so sánh với thiết kế T622 seq-diagrams-microservices). Đã bổ sung bản dịch cho cả hai sơ đồ vào entry tương ứng trong `js/i18n/q-microservices-3.en.js`, giữ nguyên key/id/url/code, số thập phân dùng dấu chấm theo tiếng Anh.
- Chỉ sửa file `js/i18n/q-microservices-3.en.js` (+31 dòng), không chạm file khác.
Reviewed-by: check-i18n (translation, no LLM review)
