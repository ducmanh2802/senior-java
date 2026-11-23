# T2602 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2583

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Báo cáo chậm do thống kê lỗi thời**: EXPLAIN ANALYZE PostgreSQL rows ước lượng 120 nhưng thực tế 1.800.000, chọn Nested Loop; sửa ANALYZE, autovacuum_analyze_scale_factor theo bảng. (2) **Bảng bị bloat do transaction mở lâu**: pg_stat_activity có session "idle in transaction" 6 giờ, n_dead_tup tăng, query chậm dần; sửa idle_in_transaction_session_timeout, sửa code giữ transaction.

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

Đã thêm 2 lab (level senior), id nối tiếp từ `lab-sql-037` (id lớn nhất trước đó). Trước: 37 lab sql → sau: 39 lab sql. Chỉ append, không sửa mục cũ.

- **lab-sql-038** — "Báo cáo chậm vì thống kê cũ: planner ước lượng 120 dòng, thực tế 1.800.000, chọn Nested Loop". Bảng append-only `shipment_line` 20.004.118 dòng; DC `warehouse_id = 9` mới go-live, nhưng `autovacuum_analyze_scale_factor = 0.1` → ngưỡng autoanalyze 50 + 0,1 × 20.004.118 = 2.000.462, trong khi 3 tháng chỉ có 1.890.442 thay đổi (< ngưỡng) nên autoanalyze chưa chạy dù vẫn bật → thống kê 16/07 cũ, warehouse 9 chưa có trong MCV → ước lượng 120, Nested Loop + Seq Scan `warehouse` lặp 1.800.000 lần (72 s). Sửa: ANALYZE, hạ `autovacuum_analyze_scale_factor` theo bảng (0.005), partition theo thời gian + ANALYZE partition mới, extended statistics `(warehouse_id, status)`. Artifacts: EXPLAIN 06:05 (Nested Loop) vs 08:30 (sau ANALYZE → Hash Join ~2 s) + snapshot thống kê.
- **lab-sql-039** — "Bảng phình to, query chậm dần vì một transaction export mở 6 giờ giữ xmin horizon". Phiên `report-export` (pid 23119) mở REPEATABLE READ + cursor rồi kẹt 6 giờ khi ghi S3 → `idle in transaction`, giữ `backend_xmin` (`age = 43.260.112`) → autovacuum chạy đều (`last_autovacuum = 14:04`) nhưng không xoá được dead tuple mới hơn snapshot → `n_dead_tup = 4.127.004` (44,8%), heap 3,1→5,4 GB, p95 6→128 ms; `age(relfrozenxid) = 118.420.334` loại trừ wraparound. Sửa: `pg_terminate_backend` + VACUUM, `idle_in_transaction_session_timeout`, dùng `COPY ... TO STDOUT` thay vì giữ transaction qua I/O. Artifacts: pg_stat_activity, pg_stat_user_tables, log export.

Góc khác đã có (tránh trùng, theo luật "chọn góc gần nhất chưa có"):
- lab-sql-038 khác **lab-sql-009** (bulk load COPY + race autoanalyze + extended stats): 038 tập trung vào **scale_factor 0,1 quá cao cho bảng append-only 20 triệu dòng** khiến autoanalyze chạy thưa → thống kê cũ 3 tháng, kèm partition theo thời gian.
- lab-sql-039 khác **lab-sql-013** (autovacuum "skipped because of lock conflict" + n_dead_tup ratio + VACUUM FULL): 039 nhấn **xmin horizon / backend_xmin** (autovacuum KHÔNG bị lock, vẫn chạy nhưng không xoá được), bằng chứng `age(backend_xmin)` + `COPY TO STDOUT` làm fix gốc. (013 dùng khung "lock conflict"; 039 phân biệt rõ hai cơ chế.)

Nghiệm thu:
- `node --check js/data/labs-sql.js` → OK.
- `node scripts/build-light-index.js` → ghi `js/data/index-light.js` OK.
- `node scripts/validate.js` → phần **Debug lab: sql 39** (37 → 39), **không có lỗi nào ở labs-sql.js**. Lưu ý: validate toàn cục hiện còn 1 lỗi **ngoài file của tôi**: `lessons-design.js: lesson-design-012.body` (inline code lồng `{ }`) — đây là bài mới của task đồng thời **T2580** (file chưa commit, `git show HEAD` không có `lesson-design-012`), tôi **không sửa** theo luật 3 (không sửa file task khác). Khi T2580 hoàn tất, validate toàn cục sẽ trở lại OK.
- Không commit (theo luật 4).
Reviewed-by: kilo (T2602R)
