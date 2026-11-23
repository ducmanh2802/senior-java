# T2607R — Fact-check nội dung mới của T2607

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2607 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kiến thức trong nội dung mới (sd-043 BNPL, sd-044 eKYC):
- Phép tính quy mô, schema PostgreSQL 15, ràng buộc UNIQUE/idempotency, state machine, ví dụ số liệu (0,05% x 1,5 triệu = 750 VND/ngày…) đều đúng.
- Markup (~~~sql, ~~~seq, bảng, danh sách, blockquote) hợp lệ; không có backtick/`${` trong nội dung template literal; không có từ nước ngoài ngoài thuật ngữ kỹ thuật.
- node scripts/validate.js → OK; node --check sd-problems.js → SYNTAX OK.
- Không sửa nội dung đã có ở HEAD; không thêm/xoá mục.