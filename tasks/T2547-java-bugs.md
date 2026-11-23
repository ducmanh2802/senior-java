# T2547 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2497

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) **Semantic cache rò rỉ dữ liệu giữa tenant**: khoá cache chỉ là embedding câu hỏi, tenant A hỏi "hạn mức tín dụng của tôi" nhận câu trả lời đã cache của tenant B — sửa: khoá gồm tenant + userScope + docVersion, câu hỏi có dữ liệu cá nhân không cache. (2) **Đổi model embedding nhưng không re-index**: chunk mới nhúng bằng model mới (dimension giống nhau), chunk cũ bằng model cũ, retrieval trả kết quả vô nghĩa, recall@5 rơi từ 0.82 xuống 0.31 — sửa: lưu embedding_model trên từng vector, query chỉ so cùng model, re-index song song rồi chuyển alias. Mô phỏng bằng Java thuần (vector store trong bộ nhớ, embedding giả xác định).

Test phải **tái hiện bug một cách xác định** (latch/barrier, fake repository đếm query, Clock cố định…), reference pass 100% (≥ 3 test), starter biên dịch được và KHÔNG pass hết. Chỉ JDK chuẩn, không class public ngoài Main, Java 17.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/test-bugs.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm bug-047 (Semantic cache rò rỉ dữ liệu giữa tenant) và bug-048 (Đổi model embedding nhưng không re-index).
Reviewed-by: verify-only (code/UI task)
