# T1308R — Fact-check nội dung mới của T1308

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1308 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Scope: chỉ review phần mới trong `git diff HEAD -- js/data/q-sql.js` (các mục `### Ví dụ đời thực` thêm cho `sql-025` → `sql-030`). Không sửa nội dung cũ ở HEAD, không thêm/xoá mục. Kiểm tra không có backtick/`${` trong diff.
- `sql-025` (NUMERIC/BigDecimal, timestamptz): nội dung kỹ thuật đúng (FLOAT IEEE 754, NUMERIC chính xác, timestamptz lưu UTC, `-Duser.timezone=UTC`), ví dụ đời thực hợp lý. Không sửa.
- `sql-026` (transaction/autocommit/SAVEPOINT): đúng cơ chế PostgreSQL "aborted transaction", hành vi MySQL InnoDB (đa số lỗi chỉ huỷ câu, deadlock huỷ transaction), `idle in transaction`/`pg_stat_activity`. Không sửa.
- `sql-027` (UNION/EXCEPT): sửa SQL trong ví dụ đời thực cho khớp kịch bản "orders và orders_archive" và khớp quy ước nửa mở đã dùng trong phần chính. Trước: `EXCEPT` chỉ truy vấn `orders` hai bên và dùng `BETWEEN ... 2025-12-31` (có thể bỏ sót bản ghi có thành phần thời gian ngày cuối). Sau: gộp `UNION ALL` cả `orders` + `orders_archive` cho năm 2025, `EXCEPT` với năm 2026, dùng `>= ... AND < '2026-01-01'`/`<'2027-01-01'`.
- `sql-028` (UPDATE FROM/batch/SKIP LOCKED): sửa ví dụ batch để self-consistent với kịch bản "5 triệu đơn PENDING quá 30 ngày". Thêm điều kiện `AND created_at < now() - interval '30 days'` vào CTE (phần chính phía trên đã có điều kiện này).
- `sql-029` (sequence/gapless invoice counter): đúng lý do sequence có gap (rollback/cache/allocation), pattern counter + `UPDATE ... RETURNING` trong cùng transaction, `UNIQUE(series, invoice_no)`, trade-off contention/throughput. Không sửa.
- `sql-030` (temporal/tstzrange/exclusion constraint): đúng khoảng nửa mở `[from, to)`, `tstzrange` + exclusion constraint `gist (product_id WITH =, valid_during WITH &&)` + `btree_gist`, pattern đóng/mở trong cùng transaction, MySQL fallback `FOR UPDATE` + kiểm tra overlap `a1 < b2 AND b1 < a2`. Không sửa.
- Validate: `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo cũ còn lại: `path.js` có 2 bài học không nằm trong PATH: `lesson-design-006, lesson-design-007`).
