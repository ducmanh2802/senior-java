# T2744 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2711

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Index không được dùng do ép kiểu ngầm**: cột phone varchar so với tham số numeric, EXPLAIN PostgreSQL Seq Scan + Filter ((phone)::numeric = ...); sửa đúng kiểu tham số. (2) **Deadlock giữa 2 transaction cập nhật số dư theo thứ tự khác nhau**: log PostgreSQL "deadlock detected" có Process/transaction id; sửa: khoá theo thứ tự id cố định.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 lab level senior vào js/data/labs-sql.js, id nối tiếp sau max (lab-sql-051): lab-sql-052, lab-sql-053. Chèn trước dòng `);` cuối file.
- lab-sql-052: PreparedStatement generic plan chọn sai kế hoạch do parameter skew (status lệch: PENDING 0,5% vs DELIVERED 85%). Góc chưa có trong file (không trùng lab 036/042 cast, không trùng lab 037/043 deadlock).
- lab-sql-053: LIKE bắt đầu wildcard ('%@gmail.com') làm B-tree index không dùng được → Seq Scan; sửa bằng pg_trgm GiN/GiST hoặc cột reverse(email) + btree. Góc chưa có trong file.
- node --check js/data/labs-sql.js: OK (không có lỗi cú pháp, không có backtick/${ trong template literal).
- node scripts/validate.js: không báo lỗi nào cho labs-sql.js (các LỖI còn lại là của q-soft.js, quiz-ops.js, labs-gc.js… — file không sở hữu, không sửa theo AGENTS.md §3).
- node scripts/build-light-index.js: BỊ BLOCK bởi lỗi cú pháp trước đó trong q-soft.js:10838 (ký tự 'tắt' trong template literal) — file không sở hữu, không thể sửa. index-light.js chưa tái sinh do lý này.
Reviewed-by: kilo (T2744R)
