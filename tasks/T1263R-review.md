# T1263R — Fact-check nội dung mới của T1263

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1263 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới thêm vào q-banking.js (các section "Ví dụ đời thực" và "Trả lời mẫu khi phỏng vấn" cho banking-007 đến banking-012). Kết quả:
- banking-007 (Maker-checker): Đúng về quy trình maker/checker, audit trail, RBAC, least privilege, check maker != checker.
- banking-008 (KYC/eKYC/AML): Đúng về masking (4 số cuối thẻ, CMND một phần, điện thoại che giữa), không log dữ liệu nhạy cảm.
- banking-009 (PCI DSS): Đúng về không lưu CVV, tokenization (PAN → token, vault tách biệt), che log (4 số cuối).
- banking-010 (ISO 8583/ISO 20022): Đúng phân biệt ISO 8583 (thẻ, trường số, MTI, field 2/4/41) vs ISO 20022 (XML/JSON, thanh toán chung).
- banking-011 (Tính lãi): Đúng BigDecimal, actual/365, setScale(2, HALF_UP) chỉ ở bước cuối, divide cần scale + RoundingMode.
- banking-012 (Core banking bảo trì): Đúng store-and-forward, hàng đợi trong DB (không memory), thông báo khách trước/sau, xử lý backlog.
Không có lỗi kỹ thuật, không có lỗi markup (không backtick, không ${, escape đúng). Không sửa nội dung đã có ở HEAD.
