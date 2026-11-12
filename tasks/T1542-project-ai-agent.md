# T1542 — Pet project: xây AI agent bằng Java (Spring Boot + Claude API)

Status: DONE
Agent: kilo
Owns: `js/data/projects.js`

Thêm **1 pet project** vào `js/data/projects.js` (đọc schema ở đầu file và 2 dự án có sẵn làm mẫu, id nối tiếp): agent hỗ trợ tra cứu đơn hàng viết bằng Spring Boot 3 gọi Claude API (tool calling tới service đơn hàng nội bộ, RAG trên tài liệu chính sách bằng pgvector, lưu hội thoại, giới hạn chi phí, eval set, trace). Chia milestone rõ ràng từ MVP đến production, mỗi milestone có tiêu chí xong và câu hỏi phỏng vấn liên quan; ghi rõ cách đưa dự án vào CV và kể khi phỏng vấn. Chỉ dùng thư viện/API có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/projects.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/projects.js logs/tmp-T1542.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm blueprint `proj-ai-order-agent` với 6 milestone từ MVP đến deploy, quyền tool dựa trên JWT, RAG pgvector, persistence, quota, eval, trace, CV và kịch bản phỏng vấn. `node --check js/data/projects.js`, `node scripts/qtool.js check js/data/projects.js proj-ai-order-agent`, `node scripts/build-light-index.js --check` đều đạt; `node scripts/validate.js` in `OK — không có lỗi.` (còn cảnh báo có sẵn về 9 bài học chưa nằm trong `path.js`).
Reviewed-by: verify-only (code/UI task)
