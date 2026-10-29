# T512 — Dịch lại (nội dung đã sửa): q-aws-3 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-aws-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-aws.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-aws-3.en.js` đã cũ: **aws-021, aws-022**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-aws.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-aws-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-aws-3 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ aws-021, aws-022 theo bản tiếng Việt hiện tại (có thêm mục Hiểu nhanh, Thuật ngữ, Cơ chế từng bước, Lỗi hay gặp kèm Triệu chứng/Cách tránh, Trả lời miệng 1 phút).
- Giữ key và tập field q/a/follow như cũ; không đụng mục khác. Code, id, region, lệnh API giữ nguyên; chỉ dịch comment/nhãn trong khối code.
- Giải thích thêm tại lần xuất hiện đầu: IdP, HSM, service-linked role, Transit Gateway, RAM, break-glass.
- `node scripts/check-i18n.js q-aws-3` → OK (2 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
