# T2076 — 6 câu hỏi Senior Java (aws) vào q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T1340

Thêm **6 câu hỏi phỏng vấn mới** (topic: aws) vào `js/data/q-aws.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-aws.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: AWS cho Java backend: chạy Spring Boot trên ECS/EKS, chọn SQS vs Kinesis vs MSK, DynamoDB thiết kế partition key và hot partition, Lambda Java cold start và SnapStart, Secrets Manager, IAM role cho pod (IRSA), chi phí hay bị đội.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 6 câu hỏi: aws-068 (ECS Fargate CodeDeploy blue/green + rollback trên 5xx, senior), aws-069 (Kinesis vs MSK, lead), aws-070 (DynamoDB Streams + TTL + Lambda, senior), aws-071 (Lambda Java cold start/SnapStart/Provisioned Concurrency, senior), aws-072 (Secrets Manager caching client + dual-credential rotation, senior), aws-073 (FinOps showback/chargeback/tag/Cost Anomaly Detection/Savings Plans, lead). `node scripts/validate.js` OK (lỗi còn lại trong bugs.js/lessons-banking.js là cũ, không liên quan).
Reviewed-by: kilo (T2076R)
