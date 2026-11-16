# T2187 — 2 bài học (claude) vào lessons-claude.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-claude.js`
After: T2186

Thêm **2 bài học mới** (track `claude`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: Model Context Protocol (MCP): host/client/server, tools vs resources vs prompts, transport stdio và streamable HTTP, thiết kế tool tốt (tên, mô tả, input schema rõ, lỗi trả về có ích, idempotent) — bài tập Java thuần: tự viết registry tool kiểu MCP (đăng ký, validate input theo schema đơn giản, dispatch), test xác định.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-claude.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Them 2 bai hoc track claude: lesson-claude-008 (order 8, MCP: host/client/server, tools/resources/prompts, transport stdio va streamable HTTP) va lesson-claude-009 (order 9, thiet ke tool: ten, mo ta, JSON Schema, loi co ich, idempotent). Moi bai co 1 bai tap Java thuan (starter + reference + tests chay xac dinh boi JDK 17), 3 cau check, related la id cau thuc (claude-001, claude-026). Da chay node --check, build-light-index, test-lessons (008: 8/8, 009: 10/10) va validate.js -> OK. Khong commit.
Reviewed-by: kilo (T2187R)
