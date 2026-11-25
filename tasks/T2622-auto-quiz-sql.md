# T2622 — 10 câu trắc nghiệm (sql) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2617

Đã thêm 10 câu qz-sql-057 … qz-sql-066 (3 câu multi: 058, 062, 065; đáp án rải đều vị trí).
Nội dung: JOIN+NULL, GROUP BY+HAVING, window function (ROW/RANK/DENSE, PARTITION), EXISTS vs IN vs JOIN, NOT IN với NULL, index composite leftmost prefix, đọc EXPLAIN (Seq/Index/Bitmap), UPSERT ON CONFLICT/EXCLUDED, COUNT(*) vs COUNT(col) trên LEFT JOIN.
`node --check js/data/quiz-spring.js` → OK. `git diff --stat`: chỉ +391 dòng, không xoá mục cũ.
LƯU Ý: `node scripts/build-light-index.js` và `validate.js` hiện báo lỗi ở file KHÁC (q-devops.js lỗi cú pháp backtick + nhiều câu devops-0xx "không tồn tại" trong path.js) do agent khác đang làm dở — KHÔNG thuộc file sở hữu. Riêng phần sql của T2622 không có lỗi validate nào (grep qz-sql/quiz-spring = rỗng). Sẽ OK khi các file devops kia hoàn tất.

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `sql`; id `qz-sql-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-sql-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: JOIN và NULL, GROUP BY + HAVING, window function, EXISTS vs IN vs JOIN, index composite và thứ tự cột, đọc EXPLAIN (Seq Scan/Index Scan/Bitmap), NOT IN với NULL, UPSERT ON CONFLICT. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-sql đã có.

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
Reviewed-by: kilo (T2622R)
