# T2114 — 2 bài học (ai) vào lessons-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`
After: T2113

Thêm **2 bài học mới** (track `ai`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: DỰ ÁN RAG BẰNG SPRING BOOT — phần 2/2: (bài 1) tìm kiếm vector cosine top-k, lọc theo metadata, ghép prompt có trích nguồn và chống prompt injection từ tài liệu; (bài 2) đánh giá chất lượng (bộ câu hỏi chuẩn, đo recall@k, câu trả lời có trích đúng nguồn), log chi phí, đưa lên CV thế nào. Bài tập Java thuần: tự cài cosine similarity + top-k bằng PriorityQueue trên vector giả, và bộ đo recall@k, test xác định.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-ai.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added `lesson-ai-017` (order 17): "RAG bằng Spring Boot (phần 2/2 — A): tìm kiếm vector top-k, lọc metadata, ghép prompt có trích nguồn và chống prompt injection" — exercise `VectorSearch` (cosine + top-k bằng `PriorityQueue<Integer>` có lọc role, tie-break ổn định).
- Added `lesson-ai-018` (order 18): "RAG bằng Spring Boot (phần 2/2 — B): đánh giá chất lượng, recall@k, trích nguồn, log chi phí và đưa vào CV" — exercise `RagEval` (recall@k, citationsValid), deterministic tests.
- `node --check js/data/lessons-ai.js` OK; `node scripts/build-light-index.js` OK; `node scripts/test-lessons.js` → Lesson exercises OK: 298/298; `node scripts/validate.js` → OK — không có lỗi.
- Chỉ sửa file sở hữu `js/data/lessons-ai.js` và file task `tasks/T2114-java-lessons-ai.md`. Không git commit.
