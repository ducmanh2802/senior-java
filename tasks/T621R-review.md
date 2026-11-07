# T621R — Fact-check nội dung mới của T621

Status: DONE
Agent: opencode
Owns: `js/data/quiz-gaps.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T621 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check và sửa 12 câu trắc banking (qz-banking-001..012) trong `js/data/quiz-gaps.js`:

- **qz-banking-001** (outbox pattern): viết lại explain chi tiết hơn — giải thích tại sao dual-write lose event, outbox pattern hoạt động thế nào (ghi event vào cùng transaction DB + relay), vì sao Kafka replay / core rollback / tăng timeout đều sai. Sửa chữ Trung "要么" → "hoặc là".
- **qz-banking-002** (refund): viết lại explain với ví dụ 4 dòng ledger (A -2tr, B +2tr, A +2tr, B -2tr) để minh họa append-only ledger và reversal entry.
- **qz-banking-003** (cut-off + EOD): viết lại explain rõ cut-off là mốc technical để phân loại value date, EOD chỉ tổng kết ngày hiện tại; giải thích business day khác calendar day.
- **qz-banking-004** (callback idempotent): viết lại explain với flow 4 bước (trích key → kiểm tra → trả kết quả cũ hoặc xử lý + lưu), giải thích vì sao 409 và bỏ qua không response đều sai. Sửa chữ Trung "原子地" → "atomic".
- **qz-banking-005** (reconciliation): viết lại explain 3 nguồn lệch (timing cả 2 chiều, sai số tiền do làm tròn, tồn tại ở một bên) và vì sao tên khách hàng không phải nguồn lệch. Sửa chữ Trung "反之" → "đối tác đã ghi nhưng core chưa thấy".
- **qz-banking-006** (BigDecimal): **đổi answer từ 2 (long) sang 1 (BigDecimal)** — trong banking, BigDecimal với scale cố định là câu trả lời chuẩn; long minor units là tối ưu hiệu năng. Viết lại explain với ví dụ `0.1 + 0.2` và giải thích tại sao float/double/long/String đều sai.
- **qz-banking-007** (PCI-DSS mask PAN): viết lại explain với Requirement 3, giải thích Base64 không phải mã hóa, MD5 không đạt chuẩn, CVV tuyệt đối không được lưu.
- **qz-banking-008** (maker-checker): viết lại explain với nguyên lý "một thao tác ảnh hưởng tiền không được một người làm trọn vẹn"; giải thích checker phải là pre-approval, không phải xem log. Sửa chữ Trung "那个人" → "người đó".
- **qz-banking-009** (timeout → PENDING): viết lại explain với 4 bước handling (PENDING → API poll → cập nhật → thông báo), giải thích vì sao retry tự động và hoàn tiền ngay đều sai.
- **qz-banking-010** (atomic transfer): viết lại explain với phân tích transaction DB (ACID) và distributed lock; giải thích saga + compensating transaction cho microservices. Sửa chữ Trung "失败" → "lỗi", "生效" → "được ghi", "短期" → "ngắn hạn".
- **qz-banking-011** (idempotency race condition): **đổi câu hỏi hoàn toàn** — thay vì hỏi "callback duplicate" (trùng qz-banking-004), hỏi về race condition khi 2 request cùng key đến song song. Viết lại explain với check-then-act không atomic, 3 cách xử lý đúng (SELECT FOR UPDATE / ON CONFLICT DO NOTHING / distributed lock).
- **qz-banking-012** (unmatched queue): viết lại explain với flow 4 bước (đưa vào queue → poll → match → escalate nếu quá SLA).

Sửa lỗi cú pháp template literal (dấu ` trong option string), chữ Trung/Nhật/Hàn/Nga lẫn vào tiếng Việt, và escape backtick bằng {{code}}.

`node scripts/validate.js` → OK. `node scripts/build-light-index.js` → đã ghi index-light.js.
