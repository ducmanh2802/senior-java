# T1532 — AI agent: 6 câu hỏi triển khai agent bằng Java (2/3)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T1531

Thêm **6 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: RAG production (chunking, embedding, pgvector/OpenSearch, hybrid search + rerank, cập nhật index); memory cho agent (ngắn hạn, dài hạn, tóm tắt); multi-agent orchestrator–worker và chi phí; MCP server viết bằng Java để expose hệ thống nội bộ cho agent; human-in-the-loop cho hành động rủi ro (chuyển tiền, xoá dữ liệu); idempotency khi agent retry tool.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1532.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm ai-059 đến ai-064: RAG production/index lifecycle, memory của agent, multi-agent và chi phí, MCP server Java an toàn, human-in-the-loop, idempotency khi retry tool. Đã chạy build-light-index và validate; kết quả `OK — không có lỗi.`.
Reviewed-by: kilo (T1532R)
