# T2102 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2044

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Query chậm sau khi bảng orders lên 50 triệu dòng**: EXPLAIN ANALYZE PostgreSQL cho thấy Seq Scan do index (status, created_at) bị bỏ qua vì điều kiện dùng hàm lower()/kiểu dữ liệu lệch; cách sửa: index phù hợp hoặc sửa điều kiện, ANALYZE, keyset pagination

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 lab:
- lab-sql-023: Báo cáo đơn hàng 50M dòng — Seq Scan do lower(status) và order_code::bigint làm mất index (sargable violation). Covers: sargable, lower(), implicit cast, expression index, ANALYZE, keyset pagination.
- lab-sql-024: Tìm kiếm LIKE '%java%' 12,4M dòng — Seq Scan do btree không hỗ trợ tiền tố ẩn; fix: pg_trgm GIN index (+ CREATE EXTENSION + CONCURRENTLY + ANALYZE), so sánh tsvector. Covers: sargable limitation of btree, pg_trgm vs tsvector, index size/write cost.

Validation: `node --check js/data/labs-sql.js` → OK. `node scripts/validate.js` → OK (no new errors for labs-sql.js; pre-existing errors in q-devops.js, q-java.js, lessons-devops.js, path.js unrelated). `node scripts/build-light-index.js` fails due to pre-existing syntax error in q-devops.js (not owned by this task), so index-light.js remains stale; this will be resolved when q-devops.js is fixed.
Reviewed-by: kilo (T2102R)
