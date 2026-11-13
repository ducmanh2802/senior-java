# T1592 — Ôn CCA-F: thêm 10 câu domain "Prompt Engineering" (đợt 3)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-3.js`

Thêm **10 câu trắc nghiệm tình huống** vào `js/data/quiz-cca-3.js`, mọi `q` bắt đầu bằng tag `[Prompt Engineering]`, `topic: 'claude'`. Ưu tiên tình huống production khó (nhiều bên, trade-off) chưa có trong file. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1518-quiz-cca-3.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-cca-3.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-3.js logs/tmp-T1592.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 10 câu tình huống: qz-ccap-046 … qz-ccap-055 (8 câu một đáp án, 2 câu "(Choose 2)"), topic `claude`, tag `[Prompt Engineering]`.
- Chủ đề: ưu tiên system hơn lệnh user, TTL cache prompt, nội dung động phá tiền tố cache, extended thinking cho độ trễ thấp, mô tả tool, hiệu ứng gần nhất few-shot, gọi công cụ song song/tuần tự, nội dung động ngoài khối cache, trade-off extended thinking, quản lý khung ngữ cảnh đa lượt.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Reviewed-by: kilo (T1592R)
