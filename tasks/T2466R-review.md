# T2466R — Fact-check nội dung mới của T2466

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2466 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- aws-067: Sửa khai báo biến trùng lặp `S3Client s3` trong code example (dòng 4717, 4719) → đổi biến thứ hai thành `s3Custom`
- aws-068: Sửa "mốt phút" → "một phút" (dòng 4812) để nhất quán tiếng Việt chuẩn
- aws-069: Sửa mô tả shard Kinesis "chia sẻ throughput tổng của stream" → "throughput tổng của stream bằng tổng các shard" (dòng 4840) để chính xác kỹ thuật; xóa lời khuyên partition key thêm mã giao dịch (dòng 4895) vì làm vỡ ordering per account
