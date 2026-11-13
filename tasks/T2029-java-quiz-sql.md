# T2029 — 12 câu trắc nghiệm (sql) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T130

Thêm **12 câu trắc nghiệm** vào `js/data/quiz.js` (topic `sql`; id `qz-sql-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-sql-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống SQL/PostgreSQL: chọn index, đọc EXPLAIN, isolation anomaly, deadlock, NULL trong so sánh và NOT IN, GROUP BY/HAVING, window function.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm **12 câu** vào `js/data/quiz.js`, id nối tiếp `qz-sql-021` … `qz-sql-032` (số lớn nhất trước đó là `qz-sql-020` trong `quiz-gaps.js`; đã kiểm tra mọi file `quiz*.js`, không trùng id).

Danh sách:
- `qz-sql-021` index trên cột phân bố lệch (partial index) — đáp án 3
- `qz-sql-022` đọc EXPLAIN ANALYZE: ước lượng số nhóm sai — đáp án 2
- `qz-sql-023` (multi) row-level lock + re-evaluate ở READ COMMITTED — đáp án [0,1]
- `qz-sql-024` leftmost prefix của index ghép (type, created_at) — đáp án 1
- `qz-sql-025` (multi) WHERE/HAVING + max per group — đáp án [0,1]
- `qz-sql-026` top-N per group bằng row_number() — đáp án 2
- `qz-sql-027` race condition check-then-insert, cần UNIQUE — đáp án 1
- `qz-sql-028` (multi) chọn index (user_id, created_at DESC) / (ip, created_at DESC) — đáp án [0,3]
- `qz-sql-029` sort tràn đĩa, thiếu index cho ORDER BY — đáp án 2
- `qz-sql-030` UPDATE cùng dòng, chờ rồi re-evaluate — đáp án 1
- `qz-sql-031` độ chọn lọc status giảm làm index mất tác dụng — đáp án 3
- `qz-sql-032` date_trunc + range trên created_at (không bọc hàm lên cột) — đáp án 1

3/12 câu `multi: true` (đúng ~1/4). Đáp án đúng rải đều vị trí 1/2/3. Không có backtick/`${` trong template literal; đã escape dấu nháy trong option (`\'`).

Kiểm tra: `node --check js/data/quiz.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` không còn lỗi nào thuộc `quiz.js` (các lỗi còn lại nằm ở `lessons-security.js` do task khác T2026 sở hữu, ngoài phạm vi file này).
Reviewed-by: kilo (T2029R)
