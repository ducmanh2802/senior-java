# T1531R — Fact-check nội dung mới của T1531

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1531 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-check diff `js/data/q-ai.js` (ai-053..ai-058, nội dung mới T1531): kiểm tra cơ chế agent/tool calling, giới hạn ngân sách/idempotency/human-in-the-loop, Claude tool_use/tool_result flow, so sánh Spring AI/LangChain4j/SDK trực tiếp, structured output + Jackson/Bean Validation/retry, SSE streaming/cancel/heartbeat/proxy, chat memory (sliding window/summarization/fact retrieval) và tách memory/audit/PII. Không phát hiện lỗi kỹ thuật rõ ràng (API/flag bịa, mặc định sai, cơ chế ngược, số liệu vô căn cứ), lỗi markup hay vi phạm luật (backtick/`${`).
- Không sửa nội dung (không có lỗi kiến thức).
- `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.` (có cảnh báo path.js sẵn có, không phải lỗi).
