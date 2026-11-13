# T1594 — Ôn CCA-F: thêm 8 câu domain "Context Management" (đợt 3)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-5.js`

Thêm **8 câu trắc nghiệm tình huống** vào `js/data/quiz-cca-5.js`, mọi `q` bắt đầu bằng tag `[Context Management]`, `topic: 'claude'`. Ưu tiên tình huống production khó (nhiều bên, trade-off) chưa có trong file. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1520-quiz-cca-5.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-cca-5.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-5.js logs/tmp-T1594.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 8 câu trắc nghiệm Context Management: qz-ccafive-036 … qz-ccafive-043 (topic: 'claude', mọi q bắt đầu bằng [Context Management]).
- Chủ đề: tool result stale trong phiên dài (036), giữ ràng buộc nguyên văn khi compact (037), tái sử dụng prompt cache đa khách hàng (038, multi), tóm tắt bàn giao ca sự cố (039), auto memory không overrides CLAUDE.md (040), bảo trì system prompt và quy tắc lỗi thời (041), lọc tool_result tránh lộ bí mật và đầy ngữ cảnh (042), cache schema qua MCP với TTL/hủy cache (043).
- node scripts/build-light-index.js và node scripts/validate.js → OK — không có lỗi. Không commit.
Reviewed-by: kilo (T1594R)
