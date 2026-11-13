# T1595 — AWS SAP-C02: thêm 20 câu (đợt 3)

Status: DONE
Agent: kilo
Owns: `js/data/aws-sap-5.js`

Thêm **20 câu** SAP-C02 vào `js/data/aws-sap-5.js`, chia đều 4 domain theo trọng số. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1559-aws-sap-5-more.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý. Chạy `node scripts/check-aws.js` → OK.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/aws-sap-5.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/aws-sap-5.js logs/tmp-T1595.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 20 câu sap-217..sap-236, exam `sap-c02`, q/options tiếng Anh, explain tiếng Việt 600–1500 ký tự, kết thúc bằng `> Exam tip:`.
- Phân bổ domain theo trọng số: sap-d1 = 5 (217–221), sap-d2 = 6 (222–227), sap-d3 = 5 (228–232), sap-d4 = 4 (233–236). Có 4 câu multi (218, 226, 234, 236 - mỗi câu 5 options, ghi "(Choose two.)").
- Chủ đề d1: SCP Region restriction, Organization Trail + Object Lock, RAM sharing EventBridge/TGW, IAM Identity Center permission sets, Billing Conductor chargeback.
- Chủ đề d2: API Gateway REST + EventBridge Pipes, Lambda SnapStart + scheduled provisioned concurrency, RDS Proxy multi-tenant routing, PrivateLink endpoint service, Athena + Parquet data lake, Amazon MQ for RabbitMQ AMQP 1.0.
- Chủ đề d3: ALB access log + Metric Filter p95 + SSM Automation, ElastiCache Redis MOVED redirection fix, CloudFront + WAF IP set reference, RDS Proxy connection pooling, S3 Intelligent-Tiering.
- Chủ đề d4: VMware Cloud on AWS, DMS homogeneous Oracle migration, Migration Hub Strategy Recommendations, DataSync NFS-to-S3 with bandwidth limit.
- `node scripts/check-aws.js` → OK (454 câu AWS); `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js` báo lỗi ở q-ai.js (ai-105) là file khác không sở hữu, file aws-sap-5.js không có lỗi.
Reviewed-by: verify-only (code/UI task)
