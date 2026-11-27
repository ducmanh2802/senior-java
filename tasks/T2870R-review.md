# T2870R — Fact-check nội dung mới của T2870

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2870 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kiến thức. Đã fact-check 3 câu mới (aws-099, aws-100, aws-101):
- aws-099: aws:SourceVpce, aws:PrincipalOrgID, kms:ViaService, gateway endpoint S3, GuardDuty finding UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration, SSE-KMS vs SSE-S3 — đều đúng, cơ chế defense-in-depth chính xác.
- aws-100: WAL async, pg_stat_replication, CloudWatch ReplicaLag/AuroraReplicaLag, Aurora reader lag <100ms, AbstractRoutingDataSource + read-your-writes — đúng.
- aws-101: Aurora per-I/O billing & I/O-Optimized, công thức HikariCP Tn×(Cm−1)+1, RDS Proxy/PgBouncer, N+1/batch/@Async — đúng.
Markup hợp lệ, không lẫn chữ nước ngoài. node --check OK. validate.js: q-aws.js không có lỗi (các lỗi còn lại thuộc file khác không thuộc task này: frontend/quiz-java/quiz-ops/lessons-*/toeic).
