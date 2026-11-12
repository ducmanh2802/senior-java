# T1531 — AI agent: 6 câu hỏi triển khai agent bằng Java (1/3)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: kiến trúc một agent (vòng lặp model → tool_use → thực thi tool → tool_result, điều kiện dừng, giới hạn số bước); tool calling với Claude API từ Java (định nghĩa tool, JSON schema, xử lý nhiều tool_use trong một lượt); Spring AI vs LangChain4j vs gọi SDK trực tiếp — khi nào chọn gì; structured output và validate kết quả; streaming response tới client (SSE); quản lý hội thoại và context dài.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1531.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 câu hỏi mới: ai-053, ai-054, ai-055, ai-056, ai-057, ai-058.
Chủ đề bao gồm: (1) Kiến trúc agent & vòng lặp tool calling, giới hạn bước/token, human-in-the-loop; (2) Tool calling với Claude API từ Java (JSON schema, tool_use, tool_result, parallel vs sequential); (3) Spring AI vs LangChain4j vs SDK trực tiếp — so sánh abstraction, tool calling, structured output, observability; (4) Structured output: JSON Schema, Jackson strict, Bean Validation, retry/fallback; (5) Streaming SSE: Flux/SseEmitter, huỷ khi client ngắt, heartbeat, proxy buffering; (6) Chat memory & context dài: sliding window, summarization, RAG memory, tách memory/history, PII masking.
Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
Reviewed-by: kilo (T1531R)
