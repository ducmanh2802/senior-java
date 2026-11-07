# T773R — Fact-check nội dung mới của T773

Status: DONE
Agent: opencode
Owns: `js/data/lessons-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T773 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `lesson-aws-005` (VPC): Sửa bảng endpoint — "Docker pull từ ECR trong private subnet" từ "Interface endpoint cho ECR + S3" (thiếu/không rõ) thành cần interface endpoint `ecr.api` + `ecr.dkr` và gateway endpoint S3 (image layer trên S3). Sửa "Route 53 Resolver" thành egress path sai kỹ thuật → NAT/firewall/proxy; ghi rõ Route 53 Resolver chỉ phân giải DNS, không thay NAT. Làm rõ phạm vi ephemeral port (IANA 49152–65535, AWS NACL thường mở 1024–65535) thay cho câu "1024–65535 với hệ điều hành hiện nay". Sửa lỗi kỹ thuật Java trong exercise CIDR: hint/reference nói `long >> 32`/shift 32 "hợp lệ" theo cách gây hiểu sai cho `/0` — reference đổi sang xử lý `bits==0` trả `true`, dùng unsigned shift `>>>`; hint giải thích đúng giới hạn shift của Java và cách an toàn.
- `lesson-aws-006` (DynamoDB): Rà soát kỹ thuật (RCU/WCU, SC/EC, Query/Scan/FilterExpression sau đọc, conditional write/optimistic lock, TransactWriteItems 100 op/tốn gấp đôi, GSI/sparse/LSI, TTL không đảm bảo đúng giờ, Streams 24h, 400KB item, 10GB/partition-key guideline, BatchGetItem 100/16MB, Query page 1MB) — không thấy API/flag bịa hay cơ chế nói ngược cần sửa thêm. Markup/template literal/backtick/`${` sạch. `node scripts/test-lessons.js` → `Lesson exercises OK: 162/162`. `node scripts/build-light-index.js` + `node scripts/validate.js` → OK.
