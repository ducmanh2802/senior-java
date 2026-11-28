# T2828R — Fact-check nội dung mới của T2828

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2828 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lessons-banking-023 (multi-currency ledger), lessons-banking-024 (three-way recon), lessons-banking-025 (period close), lessons-banking-026 (balance recon), lessons-banking-027 (order book), lessons-banking-028 (mark-to-market):
  1. Xoá 191 artifact số dòng (`4950:`, `4951:`, …) lẫn vào body text của lesson 23 và lesson 24 (vừa trong đoạn văn bình thường vừa trong code block `~~~java`/`~~~seq`).
  2. Sửa "doAML check" → "do AML check" (thiếu khoảng trắng, lesson-banking-024 body).
  3. Không có lỗi kỹ thuật về kiến thức: công thức revaluation, idempotency, matching engine price–time priority, margin call off-by-one, mark-to-market dấu short đều đúng. Test ob7 MARKET (qty 7 → 2 trades @100 + @105) đã đúng, không cần sửa.
  - node scripts/validate.js → OK (không lỗi liên quan đến lessons-banking.js)
  - node scripts/test-lessons.js → lesson-banking-023 reference 2/2 pass; các lesson banking khác không báo lỗi
