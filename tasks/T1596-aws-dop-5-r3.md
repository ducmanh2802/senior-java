# T1596 — AWS DOP-C02: thêm 20 câu (đợt 3)

Status: DONE
Agent: kilo
Owns: `js/data/aws-dop-5.js`

Thêm **20 câu** DOP-C02 vào `js/data/aws-dop-5.js`, chia đều 6 domain theo trọng số. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1560-aws-dop-5-more.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý. Chạy `node scripts/check-aws.js` → OK.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/aws-dop-5.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/aws-dop-5.js logs/tmp-T1596.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 20 câu `dop-219`..`dop-238`, id nối tiếp sau `dop-218`, không trùng ý cũ.
- Phân bổ theo trọng số domain DOP-C02 (22/17/15/15/14/17 = 100): dop-d1 = 4 (219-222), dop-d2 = 3 (223-225), dop-d3 = 3 (226-228), dop-d4 = 3 (229-231), dop-d5 = 3 (232-234), dop-d6 = 4 (235-238). Tổng 20 câu (1 multi: dop-222).
- Các chủ đề mới, không trùng với dop-199..218: CodePipeline cross-account (KMS key policy + IAM), CodeDeploy Lambda BeforeAllowTraffic + canary/linear + auto rollback, CodeArtifact domain/external connection/package origin control, CloudFormation change set + drift detection, SSM Patch Manager patch baseline + maintenance window, AWS Config managed rule + SSM Automation remediation, Session Manager (không SSH/bastion, ghi nhật ký phiên), AWS Elastic Disaster Recovery (replication liên tục, recovery point, launch instance), DynamoDB global tables (multi-Region writes, last writer wins), AWS FIS (experiment template, stop condition), CloudTrail Lake (truy vấn SQL sự kiện API), AWS X-Ray (service map, trace), CloudWatch RUM (giám sát người dùng thật), EventBridge cross-account event bus + event bus policy, EventBridge Scheduler (lịch lặp lại/ một lần), SSM OpsCenter (OpsItem), IAM Access Analyzer (finding truy cập bên ngoài), Amazon GuardDuty (finding severity), Amazon Inspector (quét lỗ hổng EC2/ECR/Lambda), Secrets Manager automatic rotation (Lambda).
- Không backtick, không `${` trong nội dung; q bằng tiếng Anh ≥ 120 ký tự, explain tiếng Việt ≥ 400 ký tự, services 1–6 mục.
- Chạy `node scripts/check-aws.js` → OK (474 câu AWS), `node scripts/build-light-index.js` (ghi index-light.js), `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
Reviewed-by: verify-only (code/UI task)
