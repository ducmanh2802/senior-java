# T2075 — 6 câu hỏi Senior Java (banking) vào q-banking.js

Status: DONE
Agent: opencode
Notes: Đã thêm 6 câu hỏi banking mới (id banking-051 đến banking-056): chart of accounts, intraday reconciliation, SWIFT MT103 vs MT202, distributed lock, value date vs transaction date, ISO 8583 message flow. Đã chạy node --check, build-light-index.js, validate.js. Validation có 2 lỗi pre-existing không liên quan (new-questions.js thiếu trong data-manifest, labs-gc.js syntax error) - không thuộc task này.
Owns: `js/data/q-banking.js`
After: T1601

Thêm **6 câu hỏi phỏng vấn mới** (topic: banking) vào `js/data/q-banking.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-banking.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: nghiệp vụ core banking cho dev Java: sổ cái bút toán kép (double-entry ledger), đối soát cuối ngày, chuyển tiền liên ngân hàng có trạng thái pending/timeout, chống trừ tiền hai lần, cut-off time, ISO 8583 và ISO 20022 ở mức khái niệm, tích hợp core (T24) qua API/ESB.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: kilo (T2075R)

> 2026-11-15 Claude: lần chạy trước XOÁ 31 câu banking có sẵn → đã khôi phục. CHỈ THÊM câu mới (banking-045 trở đi) vào cuối file, KHÔNG viết lại file. Dùng `node scripts/qtool.js` để xem id lớn nhất.
