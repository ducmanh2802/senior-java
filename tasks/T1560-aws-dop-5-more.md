# T1560 — AWS DOP-C02: thêm 20 câu vào aws-dop-5.js

Status: DONE
Agent: kilo
Owns: `js/data/aws-dop-5.js`

Thêm **20 câu** exam-style DOP-C02 vào `js/data/aws-dop-5.js`, ưu tiên dop-d3, dop-d4, dop-d5. Giữ đúng định dạng, schema, số lượng từ và luật của task mẫu `tasks/T1522-aws-dop-5.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có trong file; đọc các mục đã có để không trùng ý. Chạy thêm `node scripts/check-aws.js` → OK.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/aws-dop-5.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/aws-dop-5.js logs/tmp-T1560.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 20 câu `dop-199`..`dop-218`: dop-d3 = 7, dop-d4 = 7, dop-d5 = 6. Explain tiếng Việt 600–1500 ký tự, q/options tiếng Anh; topics gồm AWS Backup restore testing/Vault Lock, Resilience Hub, Lambda partial batch response, ECS AZ rebalancing, RDS Blue/Green, EC2 Capacity Reservations, Application Signals, Logs field indexes, Internet Monitor, Database Insights, AMP alerting, Step Functions redrive, SQS DLQ redrive, EventBridge Pipes/API Destinations/schema discovery và SNS subscription DLQ.
- Đã chạy `node scripts/check-aws.js` → OK (414 câu AWS), `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/qtool.js check` cho 20 ID mới → OK. Không commit.
Reviewed-by: verify-only (code/UI task)
