# T1590 — Ôn CCA-F: thêm 12 câu domain "Agentic Architecture" (đợt 3)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-1.js`

Thêm **12 câu trắc nghiệm tình huống** vào `js/data/quiz-cca-1.js`, mọi `q` bắt đầu bằng tag `[Agentic Architecture]`, `topic: 'claude'`. Ưu tiên tình huống production khó (nhiều bên, trade-off) chưa có trong file. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1516-quiz-cca-1.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-cca-1.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-1.js logs/tmp-T1590.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 12 câu trắc nghiệm vào js/data/quiz-cca-1.js (id qz-cca-066…qz-cca-077, topic: 'claude', mọi q bắt đầu bằng `[Agentic Architecture]`): 9 câu một đáp án (4 options) và 3 câu multi "(Choose 2)". Chủ đề: race condition khi ghi song song cùng tệp, cổng duyệt con người cho hành động tốn kém, brief subagent tự chứa đủ (mục tiêu, tool, định dạng, ví dụ, điều kiện dừng), tóm tắt context window khi gần hết, cache tool kết quả với TTL, circuit breaker cho công cụ thất bại lặp lại, xử lý rate limit 429 bằng batch nhỏ + backoff, xác thực đầu ra subagent + trường tin cậy, checkpoint lưu trạng thái cho tác vụ dài, mô tả tool chi tiết (mục đích, tham số, ví dụ, lỗi), agent hỏi làm rõ yêu cầu mơ-hoá, chuyển tiếp người hỗ trợ kèm bản tóm tắt công cụ/kết quả/trạng thái. q/options tiếng Anh, explain tiếng Việt chi tiết (giải thích đáp án đúng và từng sai). Đã chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
Reviewed-by: kilo (T1590R)
