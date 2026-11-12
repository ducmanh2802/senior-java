# T1558 — Luyện phát âm: 20 thuật ngữ AI và system design

Status: DONE
Agent: kilo
Owns: `js/data/drills-term.js`

Thêm **20 thuật ngữ** dev Việt hay đọc sai khi nói về AI và system design (ví dụ: inference, embedding, retrieval, hallucination, heuristic, deterministic, idempotent, eventual, consensus, partition, replica, throughput, orchestration, asynchronous…; bỏ từ đã có) vào `js/data/drills-term.js`. Giữ đúng định dạng, schema, số lượng từ và luật của task mẫu `tasks/T1504-en-drills-term-1.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có trong file; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/drills-term.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/drills-term.js logs/tmp-T1558.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 20 mục `drill-term-181`–`drill-term-200`: inference, embedding, retrieval, hallucination, heuristic, eventual consistency, consensus, quorum, vector, semantic, prompt, tokenization, reranking, grounding, context window, cosine similarity, attention, bottleneck, saturation, backpressure.
- `node --check js/data/drills-term.js` thành công; `node scripts/build-light-index.js` thành công; `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo sẵn có về bài học chưa nằm trong PATH).
Reviewed-by: check-i18n (translation, no LLM review)
