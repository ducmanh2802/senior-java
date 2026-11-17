# T2358 — 1 lab SQL: deadlock do 2 transaction cập nhật số dư theo thứ tự ngược nhau

Status: DONE
Added lab-sql-027 (was 026). Pre-existing syntax error in js/data/quiz-ccao-2.js ("missing ) after argument list") unrelated to this task; labs-sql.js passes node --check.
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2297

Đọc AGENTS.md mục 10 + 1 lab mẫu đầy đủ trong labs-sql.js. Thêm ĐÚNG 1 lab (id lab-sql-NNN tiếp số LỚN NHẤT, grep -o "id: 'lab-sql-[0-9]*'" | sort -V | tail -1 rồi +1): chuyển tiền A→B và B→A đồng thời trên PostgreSQL 16 gây 'deadlock detected'; artifact = log PostgreSQL thật (ERROR: deadlock detected, DETAIL: Process … waits for ShareLock on transaction …; blocked by process …, CONTEXT, STATEMENT) + pg_locks/pg_stat_activity + log ứng dụng Spring (CannotAcquireLockException) 30–150 dòng, khớp pid/xid/timestamp. answer 2500–5000 ký tự (### Nguyên nhân gốc / ### Dẫn chứng / ### Cách sửa: khoá theo thứ tự id cố định, SELECT … FOR UPDATE theo thứ tự, retry có giới hạn / ### Phòng ngừa), rubric ≥ 3, hints ≥ 2.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm).

## Nghiệm thu
`node --check js/data/labs-sql.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
