# T1721 — Phỏng vấn tiếng Anh: 4 câu về dự án AI và hợp tác quốc tế

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`

Thêm **4 câu** (level senior) vào `js/data/q-english.js`: how would you explain RAG to a non-technical client; tell me about working with a remote team across time zones on a tight deadline; how do you estimate an AI feature with uncertain scope; describe a time you disagreed with a client requirement. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1501-en-q-english-mid2-1.md` (đọc file task đó). Id nối tiếp id lớn nhất hiện có. KHÔNG đọc toàn bộ file dữ liệu lớn: dùng `node scripts/qtool.js list <file>` để xem các mục đã có (tránh trùng), `qtool.js show <file> <id>` để xem một mẫu, rồi viết ngay vào file tạm và `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-english.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-english.js logs/tmp-T1721.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 4 câu (level senior, `lang: 'en'`, mỗi câu 3 `follow` + `tags`) vào `js/data/q-english.js`, id nối tiếp sau `english-205`:
  - `english-206` — explain RAG to a non-technical client (vấn đề → ý tưởng đời thường → 3 bước → rủi ro → số liệu pilot).
  - `english-207` — remote team across time zones on a tight deadline (async, overlap window, review wait 18h → 5h).
  - `english-208` — estimating an AI feature with uncertain scope (time-boxed spike, range estimate, điểm dừng).
  - `english-209` — disagreeing with a client requirement (soft delete vs hard delete, có số liệu và kết quả).
- Đúng format task mẫu T1501: `**Tóm tắt:**` (tiếng Việt, giải thích thuật ngữ) → `### Sample answer` (English ~150–220 từ, có số liệu) → `### Useful phrases` (7–8 gạch đầu dòng, kèm nghĩa tiếng Việt) → `### Lỗi người Việt hay mắc` (4 gạch đầu dòng) → `> Senior tip:`.
- Thêm an toàn qua `logs/tmp-T1721.js` và `node scripts/qtool.js append js/data/q-english.js logs/tmp-T1721.js`; không backtick, không `${` trong nội dung; không sửa mục đã có.
- Nghiệm thu: `node scripts/qtool.js check js/data/q-english.js english-206..209` → OK; `node scripts/build-light-index.js` → ghi `js/data/index-light.js` (275.2 KB); `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo cũ về `lesson-*: không nằm trong PATH` vẫn còn, không liên quan task này).
- Không commit, không sửa file ngoài `js/data/q-english.js` và file task này.
Reviewed-by: check-i18n (translation, no LLM review)
