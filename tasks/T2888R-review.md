# T2888R — Fact-check nội dung mới của T2888

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2888 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 3 câu hỏi mới (aws-102, aws-103, aws-104):
- aws-102: Phân tích chi phí ECS Fargate vs Lambda vs EKS khi traffic tăng. Kỹ thuật đúng: Fargate 0.5 vCPU/1GB ~100 req/s, Lambda compute tốn kém ở traffic ổn định cao, RDS Proxy cho connection pool, VPC endpoint giảm NAT, EKS không phù hợp team nhỏ không có SRE. Ước lượng chi phí có ghi chú "tham khảo".
- aws-103: DynamoDB hot partition, write sharding (suffix 0-9), scatter-gather read, GSI eventual consistency, tách bảng silo cho merchant lớn. Kỹ thuật đúng: partition limit 1000 WCU, adaptive capacity không cứu key đơn lẻ, GSI có thể tự tạo hot partition, on-demand cho flash sale ngắn, idempotency key bắt buộc cho thanh toán.
- aws-104: Active-passive multi-region với Aurora Global Database, RPO <5s (lag <1s), RTO <10 phút warm standby, so sánh pilot light/warm standby/active-active, failback có kiểm soát, fencing + idempotency key. Kỹ thuật đúng: Aurora Global Database replication, Route 53 ARC, chi phí vùng phụ +30-50%, switchover vs failover.

Không có lỗi kỹ thuật, markup, hay chữ nước ngoài. Validation pass cho 3 câu hỏi mới.
