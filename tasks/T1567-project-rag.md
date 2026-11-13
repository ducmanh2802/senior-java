# T1567 — Pet project: chatbot RAG tài liệu nội bộ bằng Spring Boot + pgvector

Status: DONE
Agent: kilo
Owns: `js/data/projects.js`

Thêm **1 pet project** vào `js/data/projects.js` (đọc schema và các dự án có sẵn, đặc biệt dự án agent vừa thêm, để không trùng): chatbot hỏi đáp tài liệu nội bộ — ingest PDF/Markdown, chunking, embedding, pgvector, hybrid search, trích nguồn, phân quyền tài liệu theo người hỏi, eval set đo độ chính xác, giới hạn chi phí. Milestone từ MVP đến production, mỗi milestone có tiêu chí xong và câu hỏi phỏng vấn liên quan; cách đưa vào CV. Chỉ dùng thư viện/API có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/projects.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/projects.js logs/tmp-T1567.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Hoàn thiện project `proj-rag-java` đã có từ lần chạy trước, không tạo bản trùng. Bổ sung ingest Markdown, hybrid search (pgvector + PostgreSQL full-text với RRF), mapping milestone/câu hỏi phỏng vấn và mẫu bullet CV. `qtool check`, `node --check`, `node scripts/build-light-index.js` và `node scripts/validate.js` đều đạt; validator in `OK — không có lỗi.`
Reviewed-by: verify-only (code/UI task)
