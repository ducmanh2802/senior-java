# T2875 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2865

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Báo cáo chậm do thống kê lỗi thời**: EXPLAIN ANALYZE PostgreSQL rows ước lượng 120 nhưng thực tế 1.800.000, chọn Nested Loop; sửa ANALYZE, autovacuum_analyze_scale_factor theo bảng. (2) **Bảng bị bloat do transaction mở lâu**: pg_stat_activity có session "idle in transaction" 6 giờ, n_dead_tup tăng, query chậm dần; sửa idle_in_transaction_session_timeout, sửa code giữ transaction.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
Đã thêm 2 lab mới:
- lab-sql-060: Partitioned table stale statistics gây Nested Loop sai (ước lượng 120 rows, thực tế 1.8M) — góc mới so với lab-sql-009/010/012/013/029/034: tập trung vào stats partition CHA stale khiến planner ước lượng sai cho Append, không dùng stats partition CON fresh.
- lab-sql-061: Prepared transaction (PREPARE TRANSACTION) quên commit giữ xmin chặn vacuum, bloat n_dead_tup — góc mới so với lab-sql-013/034: dùng prepared transaction (2PC/XA) thay vì idle in transaction thông thường, mechanism xmin global chặn vacuum toàn database.

Validation: `node scripts/validate.js` pass (không còn lỗi labs-sql.js), `node scripts/build-light-index.js` thành công.
Reviewed-by: kilo (T2875R)
