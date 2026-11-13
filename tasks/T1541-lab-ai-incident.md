# T1541 — Debug lab: 2 sự cố hệ thống AI agent

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`

Thêm **2 bài debug lab** (category incident, id `lab-incident-NNN` nối tiếp) theo AGENTS.md mục 10; đọc 2 bài có sẵn làm mẫu.
(1) Agent hỗ trợ khách hàng lặp gọi tool vô hạn làm chi phí API tăng vọt trong đêm (artifact: log từng bước agent có số token, hoá đơn/metric chi phí theo giờ, config maxSteps bị thiếu).
(2) Prompt injection qua nội dung email khách gửi khiến agent gọi tool hoàn tiền sai (artifact: transcript tool_use/tool_result, audit log, cấu hình quyền tool).
Artifact phải tự nhất quán (thời gian, id request, số token, số tiền) và khớp `answer`; rubric ≥ 3 ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/labs-incident.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/labs-incident.js logs/tmp-T1541.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `lab-incident-027` (agent lặp tool làm tăng chi phí) và `lab-incident-028` (prompt injection gây hoàn nhầm); qtool check và validate đều OK.
Reviewed-by: kilo (T1541R)
