# T1554 — Ôn CCA-F: thêm 12 câu domain "Context Management" (đợt 2)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-5.js`

Thêm **12 câu trắc nghiệm tình huống** vào `js/data/quiz-cca-5.js`, id nối tiếp id lớn nhất trong file, `topic: 'claude'`, mọi `q` bắt đầu bằng tag `[Context Management]`. Đọc các câu đã có trong file để **không trùng tình huống**; giữ đúng định dạng và chất lượng của task trước (tasks/T1520-*.md): q/options tiếng Anh, explain tiếng Việt giải thích vì sao đúng và vì sao từng phương án sai; khoảng 3/4 câu một đáp án, còn lại multi (Chọn 2). Chỉ dùng tính năng có thật của Claude API / Agent SDK / Claude Code / MCP; không chắc thì viết ở mức nguyên lý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-cca-5.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-5.js logs/tmp-T1554.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 12 câu trắc nghiệm tình huống domain Context Management vào js/data/quiz-cca-5.js: qz-ccafive-024 … qz-ccafive-035, topic 'claude', mọi q bắt đầu bằng tag [Context Management].
- 9 câu một đáp án (024-032) và 3 câu multi (Chọn 2): 033, 034, 035. Đáp án đúng rải đều vị trí; q/options tiếng Anh, explain tiếng Việt giải thích vì sao đúng và vì sao từng phương án sai, kèm > Senior tip.
- Chủ đề mới, không trùng với 23 câu đã có: max_tokens vs context window, định nghĩa công cụ tiêu thụ token, context trống ở cuộc mới, đầu ra công cụ lớn (log 300 KB), mâu thuẫn system prompt vs user message, ảnh tiêu thụ token, lỗi vượt giới hạn context (API 400), context != kiến thức huấn luyện/knowledge cutoff, bí mật không đặt vào system prompt, đặt đoạn bằng chứng gần câu hỏi, resource MCP, các phần tính vào context window.
- Chỉ dùng tính năng có thật của Claude API / Claude Code / MCP ở mức nguyên lý; không backtick, không ${ trong nội dung.
- node scripts/build-light-index.js và node scripts/validate.js in OK — không có lỗi. KHÔNG commit.
Reviewed-by: kilo (T1554R)
