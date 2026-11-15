# T2113 — 2 bài học (ai) vào lessons-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`
After: T1586

Thêm **2 bài học mới** (track `ai`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: DỰ ÁN RAG BẰNG SPRING BOOT — phần 1/2, hướng dẫn từng bước như làm dự án thật: (bài 1) kiến trúc RAG tổng thể (ingest → chunk → embedding → lưu pgvector → truy vấn → ghép prompt → gọi LLM), gọi API LLM từ Spring Boot với timeout/retry/giới hạn chi phí token, cấu hình bằng ConfigurationProperties; (bài 2) cắt tài liệu thành chunk (kích thước, overlap, giữ tiêu đề), sinh embedding, schema bảng pgvector và index HNSW. Bài tập Java thuần: tự viết chunker có overlap và client LLM giả lập có retry + đếm token, test xác định.

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

Đã thêm 2 bài học vào js/data/lessons-ai.js (không sửa bài cũ 001-014):
- lesson-ai-015 (order 15): Dự án RAG bằng Spring Boot (1/2): kiến trúc tổng thể và gọi LLM an toàn — luồng ingest→chunk→embedding→pgvector→truy vấn→prompt→LLM, gọi LLM bằng HttpClient (timeout 2 tầng, retry chỉ 429/529/5xx, giới hạn max_tokens), cấu hình @ConfigurationProperties, ước lượng chi phí token. Bài tập: RagTokenClient (retry + đếm token + circuit breaker đơn giản + ngân sách token/ngày), tests 5 case deterministic, reference pass 5/5, starter compile được và fail.
- lesson-ai-016 (order 16): Dự án RAG bằng Spring Boot (2/2): chunking, embedding, pgvector và HNSW — chunking (kích thước, overlap, giữ tiêu đề), embedding, schema rag_chunk (vector(384), index HNSW vector_cosine_ops), truy vấn cosine <=> với lọc quyền allowed_roles và break tie, top-k ổn định. Bài tập: DocumentChunker (cửa sổ trượt, overlap, tiêu đề), tests 7 case deterministic, reference pass 7/7, starter compile được và fail.

related trỏ tới id câu hỏi thực: ai-001/ai-002/ai-021 (bài 15), ai-003/ai-005/ai-023 (bài 16).
Da chay: node --check (OK), node scripts/test-lessons.js (2/2 bai pass), node scripts/build-light-index.js (index-light da moi), node scripts/validate.js -> "OK — không có lỗi." Khong commit.
Reviewed-by: kilo (T2113R)
