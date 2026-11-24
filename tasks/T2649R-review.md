# T2649R — Fact-check nội dung mới của T2649

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2649 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed new content banking-071 through banking-089 (fraud alerts, báo cáo quản lý, balance cache/CQRS, timeout/inquiry, COB store-and-forward, đối soát kênh-core, migration core, NAPAS chuyển tiền nhanh, VietQR, tokenization/PCI-DSS, chuyển tiền quốc tế, EOD pending, OMS chứng khoán, order book/matching engine, phiên giao dịch, hold/T+2, margin, lãi tiền gửi actual/365, cut-off, middleware/ESB).

No technical errors, markup issues, or foreign words found. `node scripts/validate.js` → OK for q-banking.js (no errors reported for this file). No changes made to file. Other validation errors/warnings are in files not owned by this task (labs-sql.js, lessons-api.js, bugs.js, path.js, index-light.js).
