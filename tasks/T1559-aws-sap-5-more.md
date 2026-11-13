# T1559 — AWS SAP-C02: thêm 20 câu vào aws-sap-5.js

Status: DONE
Agent: kilo
Owns: `js/data/aws-sap-5.js`

Thêm **20 câu** exam-style SAP-C02 vào `js/data/aws-sap-5.js`, ưu tiên domain đang ít câu (sap-d4, sap-d3). Giữ đúng định dạng, schema, số lượng từ và luật của task mẫu `tasks/T1521-aws-sap-5.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có trong file; đọc các mục đã có để không trùng ý. Chạy thêm `node scripts/check-aws.js` → OK.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/aws-sap-5.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/aws-sap-5.js logs/tmp-T1559.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 20 câu sap-197..sap-216, exam `sap-c02`, q/options tiếng Anh, explain tiếng Việt 600–1500 ký tự, kết thúc bằng `> Exam tip:`.
- Phân bổ domain: sap-d4 = 8 (197–204), sap-d3 = 8 (205–213), sap-d1 = 2 (214–215), sap-d2 = 2 (216). Ưu tiên sap-d4 và sap-d3 theo yêu cầu.
- Có 4 câu multi (200, 210, 215, 216), mỗi câu 5 options và ghi `(Choose two.)`: 200, 210, 215, 216.
- Chủ đề d4: VMware Cloud on AWS, DMS homogeneous migration, Migration Hub Strategy Recommendations, ECS Anywhere, DataSync NFS/SMB, Volume Gateway cached/stored, DataSync incremental + bandwidth limit, Volume Gateway stored for backup.
- Chủ đề d3: FIS CPU stress, S3 Storage Lens, S3 Inventory + Athena, Backup restore testing, CloudFormation drift + StackSets, Storage Lens + Inventory combo, CloudWatch Synthetics, Intelligent-Tiering, S3 Inventory + Batch Operations.
- Chủ đề d1: Centralized root access, RAM sharing Capacity Reservations.
- Chủ đề d2: API Gateway private REST API + execute-api VPC endpoint + resource policy.
- `node scripts/check-aws.js` → OK (434 câu AWS); `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: verify-only (code/UI task)
