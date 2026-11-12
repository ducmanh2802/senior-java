# T1328R — Fact-check nội dung mới của T1328

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1328 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-check diff `HEAD -- js/data/q-aws.js`: phần mới thêm mục `### Ví dụ đời thực` cho aws-041..aws-046 (ECS/EKS, IRSA/Pod Identity, IAM/SCP debug, NAT/VPC endpoint, cost optimization, Secrets Manager/Parameter Store rotation). Không phát hiện lỗi kỹ thuật (cơ chế IRSA/Pod Identity, thứ tự IAM evaluation explicit deny → Allow → SCP/boundary, gateway vs interface endpoint, NAT data processing ~0,045 USD/GB us-east-1, Compute Savings Plans/Spot/Graviton, rotation dual-credential window đều đúng), không có backtick/`${`/markup lỗi, số liệu trong ví dụ hợp lý.
- Không sửa nội dung (không có lỗi kiến thức).
- Kiểm tra: `node --check js/data/q-aws.js` OK.
- `node scripts/validate.js` hiện KHÔNG OK do lỗi pre-existing ngoài phạm vi sở hữu (path.js tham chiếu devops-*/lesson-microservices-005 không tồn tại; `js/data/q-devops.js` có SyntaxError "Unexpected identifier 'kubectl'" làm `node scripts/build-light-index.js` fail → index-light.js báo cũ). Không sửa file ngoài `js/data/q-aws.js` theo luật task. Cần integrator/owner devops+path+index-light xử lý để validate pass toàn repo.
