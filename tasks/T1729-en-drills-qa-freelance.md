# T1729 — Luyện nói tiếng Anh: 8 bài hỏi–đáp khi gọi điện với khách freelance

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`

Thêm **8 bài hỏi–đáp** (kind "qa", theme "project" hoặc "negotiation") vào `js/data/drills-qa.js`: khách hỏi "can you walk me through your approach?", "how long will it take?", "what is your rate?", "have you done something similar?", "what do you need from us to start?", "how do you report progress?", "what if requirements change?", "why should we choose you?". Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1555-en-drills-qa-ai-sd.md`. Id nối tiếp id lớn nhất hiện có; không trùng ý với mục đã có.

> **Quan trọng:** KHÔNG đọc toàn bộ `js/data/drills-qa.js` (file lớn, sẽ hết lượt). Xem danh sách bằng `node scripts/qtool.js list js/data/drills-qa.js`, xem một mục mẫu bằng `node scripts/qtool.js show js/data/drills-qa.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/drills-qa.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1729.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 8 bài QA (kind "qa", theme "project"/"negotiation"): `drill-qa-154` (approach), `drill-qa-155` (timeline), `drill-qa-156` (rate), `drill-qa-157` (similar experience), `drill-qa-158` (what needed to start), `drill-qa-159` (progress reporting), `drill-qa-160` (requirements change), `drill-qa-161` (why choose you).
- Thêm qua `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1729.js`. Đã chạy `node --check js/data/drills-qa.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn warning cũ về lessons không nằm trong PATH).
- Không sửa mục đã có, không sửa file khác ngoài file sở hữu và file task; không commit.
Reviewed-by: check-i18n (translation, no LLM review)
