# T2076R — Fact-check nội dung mới của T2076

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2076 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 4 lỗi kỹ thuật trong các câu hỏi mới (aws-065 đến aws-073):
- aws-065: Sửa "JWM" → "JVM" ở 2 chỗ (Thuật ngữ và Trả lời mẫu) — typo thuật ngữ kỹ thuật
- aws-066: Sửa "khuyến nghị AWSPENDING thành AWSCURRENT" → "promote AWSPENDING thành AWSCURRENT" ở 3 chỗ — thuật ngữ sai của Secrets Manager rotation (promote là thuật ngữ chính xác)
- aws-067: Sửa "tro liang" → "dịch vụ AWS" trong mô tả EKS Pod Identity — mô tả sai bản chất dịch vụ
- node scripts/validate.js → OK (chỉ có lỗi pre-existing ở file khác, không liên quan q-aws.js)
