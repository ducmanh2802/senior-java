# T2321 — 5 câu phỏng vấn AWS cho Java backend mới

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2239

Thêm 5 câu: chạy Spring Boot trên ECS Fargate vs EKS vs Lambda (cold start, SnapStart cho Java), RDS PostgreSQL failover Multi-AZ và ảnh hưởng tới HikariCP (DNS, timeout), SQS FIFO vs Standard + DLQ + visibility timeout cho job dài, IAM role cho service (không access key), gọi Amazon Bedrock/Claude từ Java trong VPC (PrivateLink, quota, retry). Giới hạn dịch vụ phải đúng hiện hành, không chắc thì nói nguyên lý. Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm).

## Nghiệm thu
`node --check js/data/q-aws.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Id trước: 73 (aws-001 … aws-073). Id sau: 78 (aws-001 … aws-078). Đã thêm đúng 5 câu: **aws-074, aws-075, aws-076, aws-077, aws-078** (tăng 73 → 78, không giảm).
- Nội dung 5 câu mới:
  - aws-074 senior — Chọn ECS Fargate / EKS / Lambda cho API Spring Boot traffic spiky, cold start + SnapStart (bảng so sánh, ví dụ task definition, số liệu p99/chi phí).
  - aws-075 senior — RDS PostgreSQL Multi-AZ failover và ảnh hưởng tới HikariCP: DNS CNAME, connectTimeout/socketTimeout, keepalive, maxLifetime, retry idempotent (có ví dụ cấu hình HikariCP).
  - aws-076 senior — SQS Standard vs FIFO + DLQ + visibility timeout cho job dài: heartbeat ChangeMessageVisibility, head-of-line blocking theo message group, ví dụ code worker SQS.
  - aws-077 senior — IAM role cho service, không access key: cross-account role, trust policy + ExternalId (chống confused deputy), identity vs resource policy (2 ví dụ JSON).
  - aws-078 senior — Gọi Amazon Bedrock/Claude từ Java trong VPC: PrivateLink (interface endpoint bedrock-runtime), IAM InvokeModel, quota TPM/RPM, retry backoff + Provisioned Throughput (ví dụ AWS SDK v2 Converse).
- Nội dung viết có dấu tiếng Việt đầy đủ, mở đầu `**Tóm tắt:**`, có `### cơ chế`, code ≤ 30 dòng, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn`, kết `> Senior tip:`. Không backtick, không `${`. Tránh trùng ý với aws-001/041/049/050/054/065 (đọc bằng `qtool list`).
- Đã hoàn nguyên một sửa đổi dở dang (chưa commit) trên aws-050 (SQS) từ lần chạy trước về đúng bản HEAD, theo luật "chỉ THÊM, không sửa mục cũ".
- Nghiệm thu: `node --check js/data/q-aws.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` chạy và file q-aws.js **không có lỗi/cảnh báo** (`node scripts/qtool.js check js/data/q-aws.js` → OK). Lưu ý: `validate.js` toàn repo vẫn báo 6 lỗi ở các file của agent khác (sdlc.js, quiz-design.js, quiz-ops.js) — không thuộc quyền sở hữu của task này nên KHÔNG sửa (luật 3).
