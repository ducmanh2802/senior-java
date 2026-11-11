# T1245R — Fact-check nội dung mới của T1245

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1245 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check nội dung mới của T1245 (banking-001 .. banking-015): đã kiểm tra toàn bộ diff — markup đúng, không backtick, không `${`, không chữ nước ngoài lồng vào; thuật ngữ (core banking, EOD, NAPAS, double-entry ledger, BigDecimal, idempotency, PCI DSS, ISO 8583/20022, actual/365, maker-checker, RBAC, KYC/eKYC, AML, tokenization, authorization/capture/settlement/chargeback, VietQR, auto-debit mandate) đều đúng kỹ thuật với banking hiện hành; không có API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ. Không cần chỉnh thêm.
