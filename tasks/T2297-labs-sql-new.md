# T2297 — 2 debug lab SQL mới: index không dùng do kiểu dữ liệu lệch, lock chờ do migration ALTER TABLE

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2285

Đọc AGENTS.md mục 10 và HẾT các mục hiện có trong `js/data/labs-sql.js` (grep tiêu đề) để **không trùng tình huống**. Artifact phải giống THẬT và tự nhất quán (tên thread/service, id, timestamp, số liệu khớp nhau và khớp đáp án). id tiếp nối số lớn nhất hiện có. Thêm:
1. **Index bị bỏ qua vì so sánh varchar với tham số kiểu khác / hàm bọc cột** (EXPLAIN ANALYZE PostgreSQL trước/sau, Seq Scan → Index Scan, số liệu buffers).
2. **Migration ALTER TABLE ADD COLUMN ... DEFAULT/ thêm constraint giữ ACCESS EXCLUSIVE lock, mọi query xếp hàng** (pg_stat_activity + pg_locks thật, wait_event Lock:relation); sửa bằng lock_timeout, NOT VALID + VALIDATE CONSTRAINT, chia bước.

> **CẢNH BÁO GHI ĐÈ:** chỉ THÊM bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG sửa object có sẵn. Đếm `grep -c "id: '"` trước/sau. Đánh DONE bằng cách sửa dòng `Status:` ở đầu file.
> Luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (AGENTS.md mục 5).

## Quy tắc chung
- Người đọc: dev Java 4 năm, ít va chạm production, cần giải thích **từ gốc, rất chi tiết** (vì sao, cơ chế bên trong, cách điều tra từng bước).
- Đúng kỹ thuật Java 17/21, Spring Boot 3.x, PostgreSQL 16, HikariCP. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.

## Nghiệm thu
`node --check js/data/labs-sql.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes

- Đã thêm 2 lab vào cuối `js/data/labs-sql.js` (chèn trước `);`, không sửa object cũ):
  - `lab-sql-025` — Báo cáo đơn VIP lọc theo thuộc tính JSON: Seq Scan 19,6 triệu dòng vì bọc cast quanh biểu thức `metadata->>'tier'` / `(metadata->>'loyalty')::int`; EXPLAIN ANALYZE trước/sau (4.584 ms → 41,6 ms; 4.603 ms → 11,7 ms), expression index + ANALYZE, generated column, GIN jsonb_path_ops.
  - `lab-sql-026` — Migration Flyway thêm CHECK + FK không NOT VALID trên bảng 61.284.910 dòng: ACCESS EXCLUSIVE giữ tới COMMIT (Flyway bọc 1 transaction), 512 backend xếp hàng (`pg_stat_activity` + `pg_locks`, `wait_event = Lock:relation`, `pg_blocking_pids = {51422}`), CPU 11%; sửa bằng `lock_timeout`, `NOT VALID` + `VALIDATE CONSTRAINT` (ShareUpdateExclusiveLock), chia bước, `CREATE INDEX CONCURRENTLY` ngoài transaction.
- Mỗi lab 3 artifact, 3 câu hỏi, 3 hints, 5 rubric; có khối `~~~seq` (AGENTS.md mục 5). id tiếp nối lab-sql-024.
- `grep -c "id: '"`: 19 → 21. `node --check js/data/labs-sql.js` → OK.
- `node scripts/build-light-index.js` → OK (lab không nằm trong light index).
- `node scripts/validate.js labs-sql.js` → `OK — không có lỗi.`
- `node scripts/validate.js` (toàn bộ) hiện còn 1 lỗi **không thuộc file này**: `labs-gc.js: lab-gc-003.answer: có ký tự lạ "隔离"` — file của task T2303 (agent khác đang làm dở). Không sửa vì luật 3 (chỉ sửa file sở hữu).
- Không commit, không push.
Reviewed-by: kilo (T2297R)
