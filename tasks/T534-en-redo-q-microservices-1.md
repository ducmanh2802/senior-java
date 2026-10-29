# T534 — Dịch lại (nội dung đã sửa): q-microservices-1 (10 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-microservices-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-microservices.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-microservices-1.en.js` đã cũ: **microservices-001, microservices-002, microservices-003, microservices-004, microservices-005, microservices-006, microservices-007, microservices-008, microservices-009, microservices-010**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-microservices.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-microservices-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-microservices-1 → OK; node scripts/validate.js → OK.

## Notes

Dịch lại toàn bộ 10 mục (microservices-001…010) từ bản tiếng Việt hiện tại trong `js/data/q-microservices.js`, gồm cả các mục mới thêm sau lần dịch trước: `### Hiểu nhanh`, `### Thuật ngữ`, `### Lỗi hay gặp`, `### Trả lời miệng 1 phút`. Giữ nguyên key, id, url và tập field `q`/`a`/`follow`; comment và chuỗi trong code mẫu (ArchUnit, Outbox, YAML Resilience4j…) đã dịch sang tiếng Anh. Không backtick, không `${`, không còn dấu tiếng Việt ngoài khối `~~~`. Chỉ sửa `js/i18n/q-microservices-1.en.js`.
Kiểm tra: `node scripts/check-i18n.js q-microservices-1` → `OK — 10 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`Reviewed-by: check-i18n (translation, no LLM review)
