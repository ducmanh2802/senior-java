# T2597 — 10 câu trắc nghiệm (db) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2578

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `db`; id `qz-db-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-db-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: isolation level PostgreSQL (Read Committed vs Repeatable Read vs Serializable thực tế), MVCC và VACUUM, index B-tree vs GIN vs BRIN, partial/covering index, lock row vs advisory lock, connection pool sizing. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-db đã có.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-spring.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

## Notes
Thêm qz-db-931..940 (10 câu) vào js/data/quiz-spring.js. node --check OK. build-light-index.js thất bại do lỗi cú pháp sẵn có trong js/data/lessons-aws.js (không thuộc phạm vi task); validate báo index-light cũ và lesson aws thiếu.
Reviewed-by: kilo (T2597R)
