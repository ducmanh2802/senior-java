# T43 — Nội dung: Debug lab — SQL & database (PostgreSQL ưu tiên, có 1 bài MySQL)

Status: TODO
Agent: opencode
Owns: `js/data/labs-sql.js`

> **Ghi theo lô nhỏ:** viết **1 lab mỗi lần edit** (artifact dài). Sau mỗi lab chạy `node --check js/data/labs-sql.js` và `node scripts/validate.js labs-sql.js`.

Đọc `AGENTS.md` mục 4–6 và **mục 10** (schema LABS) trước khi bắt đầu.

## Mục tiêu
Viết **5 lab** với `category: 'sql'`, ID từ `lab-sql-001`, mỗi lab một tình huống:
- EXPLAIN ANALYZE: seq scan vì gọi hàm trên cột hoặc lệch kiểu dữ liệu (varchar vs bigint)
- Composite index sai thứ tự cột so với điều kiện WHERE / ORDER BY
- N+1 query nhìn từ log SQL của Hibernate (show_sql + statistics)
- Deadlock log PostgreSQL: 2 transaction cập nhật số dư theo thứ tự ngược nhau
- pg_stat_activity + chuỗi lock wait do một transaction 'idle in transaction' (MySQL: SHOW ENGINE INNODB STATUS cho 1 bài)

## Yêu cầu chất lượng (quan trọng nhất)
- Artifact phải trông **như thật**: đúng định dạng output của công cụ thật (jstack / GC log unified JDK 17 / EXPLAIN (ANALYZE, BUFFERS) PostgreSQL 15 / log JSON của Spring Boot…), có cả nhiễu (thread, dòng log không liên quan) để người học phải tự lọc.
- **Nhất quán tuyệt đối**: id, địa chỉ lock, timestamp, số liệu trong artifact phải khớp nhau và khớp với `answer`. `answer` phải trích dẫn dòng cụ thể làm bằng chứng.
- `answer` giải thích chi tiết (≥ 1500 ký tự): nguyên nhân gốc, dẫn chứng, cách sửa ngắn hạn và dài hạn, cách phòng ngừa (monitoring/alert), và những ý một Senior sẽ nói thêm.
- Bối cảnh gần với hệ thống ngân hàng, fintech, e-commerce Việt Nam (thanh toán, ví, đối soát, flash sale…).

## Nghiệm thu
`node scripts/validate.js` → OK với 5 lab. Sau đó integrator sẽ review fact-check.

## Notes
