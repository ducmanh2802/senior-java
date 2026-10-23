# T120 — Track bài học `db`: cơ chế database tự mô phỏng bằng Java

Status: TODO
Agent: agy
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001`. Tạo file mới (KHÔNG sửa index.html — integrator gắn sau). **5 bài** `lesson-db-001..005` (track `db`): (1) isolation level: mô phỏng dirty read / non-repeatable read / lost update bằng 2 "transaction" chạy xen kẽ có kịch bản cố định; (2) optimistic locking với version + retry; (3) index B-tree vs full scan: tự cài TreeMap index, đếm số phép so sánh; (4) connection pool: tự cài pool có giới hạn + timeout, thấy cạn pool khi giữ connection lâu; (5) phân trang offset vs keyset: đếm số dòng phải bỏ qua. Body liên hệ PostgreSQL 15 / MVCC chính xác. JDK chuẩn, Java 17, deterministic. `node scripts/test-lessons.js` + `node scripts/validate.js` → OK.

## Notes
