# T2142R — Fact-check nội dung mới của T2142

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2142 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Đã fact-check toàn bộ js/data/q-aws.js (aws-001..aws-073): các chốt số liệu/KSA đã đối chiếu với tài liệu hiện hành và đều chính xác (S3 object tối đa 50 TB từ 12/2025; graceful shutdown mặc định từ Spring Boot 3.4; ECS stopTimeout mặc định 30s, Fargate tối đa 120s; ALB deregistration delay mặc định 300s; SnapStart chỉ trên phiên bản/alias đã publish, không áp $LATEST và event source mapping). Markup hợp lệ (~~~ bash/java/json/seq/text/yaml; không backtick, không ${ bên trong template literal). Không có chữ nước ngoài lẫn vào. Hai hunk so với HEAD (aws-062 ~~~bash, aws-067 VPC/hyperplane ENI) đã chính xác, không cần sửa. Không thêm/xoá câu hỏi.
